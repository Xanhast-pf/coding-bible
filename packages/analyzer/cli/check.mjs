import path from "node:path";

import { analyzeProgram } from "../src/index.ts";
import {
  applyBaseline,
  loadBaseline,
  resolveBaselinePath,
} from "./baseline.mjs";
import {
  clearAnalyzerCache,
  createProjectCacheIdentity,
  createProjectSignature,
  readProjectCache,
  resolveCacheDirectory,
  writeProjectCache,
} from "./cache.mjs";
import {
  createConfigResolver,
  defaultIgnore,
  loadAnalyzerConfig,
} from "./config.mjs";
import { getGitScopedFiles } from "./git.mjs";
import {
  createProjectPlans,
  createProjectProgram,
  discoverSourceFiles,
  languageByExtension,
  prepareProjectPlan,
} from "./project.mjs";

const toRelativePath = (cwd, filePath) => {
  const relativePath = path.relative(cwd, filePath);
  return relativePath || path.basename(filePath);
};

const toCacheKey = (cwd, filePath) =>
  toRelativePath(cwd, filePath).replaceAll("\\", "/");

export const collectSourceFiles = async (
  targets,
  { cwd = process.cwd(), config } = {},
) => {
  const resolvedConfig = config ?? {
    ignore: defaultIgnore,
    include: ["**/*"],
  };
  const { files } = await discoverSourceFiles(targets, {
    config: resolvedConfig,
    cwd,
  });
  return files;
};

const emptyResult = ({
  discovery,
  loadedConfig,
  profile,
  rootDir,
  scope,
  startedAt,
}) => {
  const result = {
    baseline: null,
    cache: {
      enabled: loadedConfig.config.cache !== false,
      hits: 0,
      misses: 0,
    },
    checksRun: 0,
    configPath: loadedConfig.configPath
      ? toRelativePath(rootDir, loadedConfig.configPath)
      : null,
    diagnostics: [],
    errors: 0,
    filesDiscovered: discovery.discovered.length,
    filesScanned: 0,
    findings: [],
    projectCount: 0,
    projectFiles: 0,
    rootDir,
    ruleIdsChecked: [],
    scope,
    tsconfigPaths: [],
    warnings: 0,
  };

  if (profile) {
    result.profile = {
      analysisMs: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheMs: 0,
      configMs: loadedConfig.loadMs,
      discoveryMs: discovery.discoveryMs,
      programMs: 0,
      rssMb: process.memoryUsage().rss / (1024 * 1024),
      totalMs: performance.now() - startedAt,
    };
  }
  return result;
};

export const checkPaths = async (
  targets,
  {
    baseline = true,
    baselinePath,
    cache = true,
    clearCache = false,
    configPath,
    cwd = process.cwd(),
    profile = false,
    scope = { mode: "project" },
    signal,
  } = {},
) => {
  const totalStartedAt = performance.now();
  signal?.throwIfAborted();
  const loadedConfig = await loadAnalyzerConfig({ cwd, configPath });
  const rootDir = loadedConfig.rootDir;
  const resolvedTargets = targets.length
    ? targets.map((target) => path.resolve(cwd, target))
    : [rootDir];
  signal?.throwIfAborted();
  const resolver = createConfigResolver(loadedConfig.config, rootDir);
  const scopedFiles = await getGitScopedFiles({
    cwd: rootDir,
    mode: scope.mode,
    ref: scope.ref,
  });
  signal?.throwIfAborted();
  const discovery = await discoverSourceFiles(resolvedTargets, {
    config: loadedConfig.config,
    cwd: rootDir,
    scopedFiles,
  });
  signal?.throwIfAborted();

  const cacheDirectory = resolveCacheDirectory(rootDir, loadedConfig.config, {
    enabled: cache,
  });
  if (clearCache) {
    await clearAnalyzerCache(cacheDirectory);
  }

  if (!discovery.files.length) {
    return emptyResult({
      discovery,
      loadedConfig,
      profile,
      rootDir,
      scope,
      startedAt: totalStartedAt,
    });
  }

  const projectPlans = createProjectPlans(discovery.files, {
    cwd: rootDir,
    tsconfig: loadedConfig.config.tsconfig,
  });
  const findings = [];
  const diagnostics = [];
  const ruleIdsChecked = new Set();
  const tsconfigPaths = new Set();
  let checksRun = 0;
  let projectFiles = 0;
  let filesScanned = 0;
  let programMs = 0;
  let analysisMs = 0;
  let cacheMs = 0;
  let cacheHits = 0;
  let cacheMisses = 0;

  for (const plan of projectPlans) {
    signal?.throwIfAborted();
    const prepared = prepareProjectPlan(plan, { cwd: rootDir });
    projectFiles += prepared.rootNames.length;
    if (prepared.tsconfigPath) {
      tsconfigPaths.add(toRelativePath(rootDir, prepared.tsconfigPath));
    }

    const inputs = prepared.files.flatMap((filePath) => {
      const language = languageByExtension.get(path.extname(filePath));
      return language ? [{ fileName: filePath, language }] : [];
    });
    filesScanned += inputs.length;

    let signature = null;
    let projectIdentity = null;
    let cachedResults = {};
    const cacheEligible =
      Boolean(cacheDirectory) && !prepared.projectReferences.length;

    if (cacheEligible) {
      const signatureResult = await createProjectSignature(prepared, {
        config: loadedConfig.config,
        rootDir,
        signal,
      });
      signature = signatureResult.signature;
      cacheMs += signatureResult.cacheMs;
      projectIdentity = createProjectCacheIdentity({
        rootDir,
        tsconfigPath: prepared.tsconfigPath,
      });
      const cached = await readProjectCache(
        cacheDirectory,
        projectIdentity,
        signature,
      );
      cachedResults = cached?.results ?? {};
    }

    const resultsByFile = new Map();
    const missingInputs = [];
    for (const input of inputs) {
      const cacheKey = toCacheKey(rootDir, input.fileName);
      const cachedResult = cacheEligible ? cachedResults[cacheKey] : null;
      if (cachedResult) {
        cacheHits += 1;
        resultsByFile.set(input.fileName, cachedResult);
      } else {
        if (cacheEligible) {
          cacheMisses += 1;
        }
        missingInputs.push(input);
      }
    }

    if (missingInputs.length) {
      const project = createProjectProgram(prepared);
      programMs += project.programMs;
      signal?.throwIfAborted();
      const analysisStartedAt = performance.now();
      const freshResults = analyzeProgram(project.program, missingInputs, {
        isRuleEnabled: resolver.isRuleEnabled,
        signal,
      });
      analysisMs += performance.now() - analysisStartedAt;

      freshResults.forEach((result, index) => {
        const input = missingInputs[index];
        if (!input) {
          return;
        }
        resultsByFile.set(input.fileName, result);
        if (cacheEligible) {
          cachedResults[toCacheKey(rootDir, input.fileName)] = result;
        }
      });

      if (cacheEligible && signature && projectIdentity) {
        await writeProjectCache(
          cacheDirectory,
          projectIdentity,
          signature,
          cachedResults,
        );
      }
    }

    for (const input of inputs) {
      const result = resultsByFile.get(input.fileName);
      if (!result) {
        continue;
      }
      checksRun += result.checksRun;
      result.ruleIdsChecked.forEach((ruleId) => ruleIdsChecked.add(ruleId));

      for (const diagnostic of result.diagnostics) {
        diagnostics.push({
          ...diagnostic,
          filePath: toRelativePath(rootDir, input.fileName),
        });
      }

      for (const finding of result.findings) {
        findings.push({
          ...finding,
          filePath: toRelativePath(rootDir, input.fileName),
          severity: resolver.getRuleSetting(finding.ruleId, input.fileName),
        });
      }
    }
  }

  const byLocation = (left, right) =>
    left.filePath.localeCompare(right.filePath) ||
    left.location.line - right.location.line ||
    left.location.column - right.location.column;

  findings.sort(
    (left, right) =>
      byLocation(left, right) || left.ruleId.localeCompare(right.ruleId),
  );
  diagnostics.sort(byLocation);

  const resolvedBaselinePath = resolveBaselinePath(
    rootDir,
    loadedConfig.config,
    { enabled: baseline, overridePath: baselinePath },
  );
  const loadedBaseline = await loadBaseline(resolvedBaselinePath);
  const baselineResult = applyBaseline(findings, loadedBaseline);
  const activeFindings = baselineResult.findings;
  const errors = activeFindings.filter(
    ({ severity }) => severity === "error",
  ).length;
  const warnings = activeFindings.filter(
    ({ severity }) => severity === "warning",
  ).length;
  const result = {
    baseline: loadedBaseline
      ? {
          entries: loadedBaseline.findings.length,
          path: toRelativePath(rootDir, resolvedBaselinePath),
          suppressed: baselineResult.suppressedFindings.length,
        }
      : null,
    cache: {
      enabled: Boolean(cacheDirectory),
      hits: cacheHits,
      misses: cacheMisses,
    },
    checksRun,
    configPath: loadedConfig.configPath
      ? toRelativePath(rootDir, loadedConfig.configPath)
      : null,
    diagnostics,
    errors,
    filesDiscovered: discovery.discovered.length,
    filesScanned,
    findings: activeFindings,
    projectCount: projectPlans.length,
    projectFiles,
    rootDir,
    ruleIdsChecked: [...ruleIdsChecked].sort(),
    scope,
    tsconfigPaths: [...tsconfigPaths].sort(),
    warnings,
  };

  if (profile) {
    result.profile = {
      analysisMs,
      cacheHits,
      cacheMisses,
      cacheMs,
      configMs: loadedConfig.loadMs,
      discoveryMs: discovery.discoveryMs,
      programMs,
      rssMb: process.memoryUsage().rss / (1024 * 1024),
      totalMs: performance.now() - totalStartedAt,
    };
  }

  return result;
};
