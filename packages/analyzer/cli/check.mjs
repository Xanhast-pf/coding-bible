import path from "node:path";

import {
  analyzeProgram,
  createAnalyzerRuleSelectionPredicate,
  detectors,
  normalizeAnalyzerRuleSelection,
  createAnalyzerCustomRuleDetectors,
  getConfiguredAnalyzerRuleIds,
} from "../src/index.ts";
import {
  applyBaseline,
  loadBaseline,
  resolveBaselinePath,
} from "./baseline.mjs";
import {
  clearAnalyzerCache,
  createProjectCacheIdentity,
  createProjectCacheSignatures,
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
  createSourceFileProgram,
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
  cacheEnabled,
  discovery,
  loadedConfig,
  profile,
  rootDir,
  ruleSelection,
  scope,
  startedAt,
}) => {
  const result = {
    baseline: null,
    cache: {
      enabled: cacheEnabled,
      hits: 0,
      misses: 0,
      partialHits: 0,
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
    ruleSelection,
    scope,
    tsconfigPaths: [],
    warnings: 0,
  };

  if (profile) {
    result.profile = {
      analysisMs: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cachePartialHits: 0,
      cacheMs: 0,
      configMs: loadedConfig.loadMs,
      discoveryMs: discovery.discoveryMs,
      programMs: 0,
      projectCacheHits: 0,
      projectCacheMisses: 0,
      rssMb: process.memoryUsage().rss / (1024 * 1024),
      sourceCacheHits: 0,
      sourceCacheMisses: 0,
      totalMs: performance.now() - startedAt,
    };
  }
  return result;
};

const mergeAnalyzeResults = (...results) => {
  const available = results.filter(Boolean);
  const findings = available.flatMap((result) => result.findings);
  const diagnostics = available.flatMap((result) => result.diagnostics);

  return {
    checksRun: available.reduce((total, result) => total + result.checksRun, 0),
    diagnostics,
    findings,
    ruleIdsChecked: [
      ...new Set(available.flatMap((result) => result.ruleIdsChecked)),
    ].sort(),
  };
};

const detectorApplies = (detector, input, isRuleEnabled) =>
  (!detector.languages || detector.languages.includes(input.language)) &&
  isRuleEnabled(detector.ruleId, input.fileName);

const hasProjectDetector = (input, isRuleEnabled) =>
  detectors.some(
    (detector) =>
      detector.dependencyScope === "project" &&
      detectorApplies(detector, input, isRuleEnabled),
  );

const createEmptyAnalyzeResult = () => ({
  checksRun: 0,
  diagnostics: [],
  findings: [],
  ruleIdsChecked: [],
});

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
    ruleSelection = {},
    scope = { mode: "project" },
    signal,
  } = {},
) => {
  const totalStartedAt = performance.now();
  signal?.throwIfAborted();
  const loadedConfig = await loadAnalyzerConfig({ cwd, configPath });
  const rootDir = loadedConfig.rootDir;
  const configuredRuleIds = getConfiguredAnalyzerRuleIds(loadedConfig.config);
  const normalizedRuleSelection = normalizeAnalyzerRuleSelection(
    ruleSelection,
    configuredRuleIds,
  );
  const ruleSelected = createAnalyzerRuleSelectionPredicate(
    normalizedRuleSelection,
    configuredRuleIds,
  );
  const resolvedTargets = targets.length
    ? targets.map((target) => path.resolve(cwd, target))
    : [rootDir];
  signal?.throwIfAborted();
  const resolver = createConfigResolver(loadedConfig.config, rootDir);
  const additionalDetectors = createAnalyzerCustomRuleDetectors(
    loadedConfig.config.customRules,
  );
  const isRuleEnabled = (ruleId, fileName) =>
    ruleSelected(ruleId) && resolver.isRuleEnabled(ruleId, fileName);
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
      cacheEnabled: Boolean(cacheDirectory),
      discovery,
      loadedConfig,
      profile,
      rootDir,
      ruleSelection: normalizedRuleSelection,
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
  let cachePartialHits = 0;
  let sourceCacheHits = 0;
  let sourceCacheMisses = 0;
  let projectCacheHits = 0;
  let projectCacheMisses = 0;

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
    const projectDetectorNeeded = inputs.some((input) =>
      hasProjectDetector(input, isRuleEnabled),
    );

    let projectSignature = null;
    let sourceSignatures = {};
    let projectIdentity = null;
    let cachedSourceResults = {};
    let cachedProjectResults = {};
    const cacheEligible =
      Boolean(cacheDirectory) && !prepared.projectReferences.length;

    if (cacheEligible) {
      const signatures = await createProjectCacheSignatures(prepared, {
        config: loadedConfig.config,
        includeProjectSignature: projectDetectorNeeded,
        rootDir,
        ruleSelection: normalizedRuleSelection,
        signal,
        sourceFilePaths: inputs.map(({ fileName }) => fileName),
      });
      projectSignature = signatures.projectSignature;
      sourceSignatures = signatures.sourceSignatures;
      cacheMs += signatures.cacheMs;
      projectIdentity = createProjectCacheIdentity({
        rootDir,
        tsconfigPath: prepared.tsconfigPath,
      });
      const cached = await readProjectCache(cacheDirectory, projectIdentity);
      cachedSourceResults = cached?.sourceResults ?? {};
      cachedProjectResults = cached?.projectResults ?? {};
    }

    const sourceResultsByFile = new Map();
    const projectResultsByFile = new Map();
    const sourceMissingInputs = [];
    const projectRequiredByFile = new Map();

    for (const input of inputs) {
      const cacheKey = toCacheKey(rootDir, input.fileName);
      const sourceSignature = sourceSignatures[cacheKey];
      const sourceEntry = cachedSourceResults[cacheKey];
      const sourceHit =
        cacheEligible &&
        Boolean(sourceSignature) &&
        sourceEntry?.signature === sourceSignature;

      if (sourceHit) {
        sourceCacheHits += 1;
        sourceResultsByFile.set(input.fileName, sourceEntry.result);
      } else {
        if (cacheEligible) {
          sourceCacheMisses += 1;
        }
        sourceMissingInputs.push(input);
      }

      const needsProject = hasProjectDetector(input, isRuleEnabled);
      projectRequiredByFile.set(input.fileName, needsProject);
      let projectHit = !needsProject;
      if (needsProject && cacheEligible) {
        const projectEntry = cachedProjectResults[cacheKey];
        projectHit =
          Boolean(projectSignature) &&
          projectEntry?.signature === projectSignature;
        if (projectHit) {
          projectCacheHits += 1;
          projectResultsByFile.set(input.fileName, projectEntry.result);
        } else {
          projectCacheMisses += 1;
        }
      }

      if (cacheEligible) {
        if (sourceHit && projectHit) {
          cacheHits += 1;
        } else {
          cacheMisses += 1;
          if (sourceHit || (needsProject && projectHit)) {
            cachePartialHits += 1;
          }
        }
      }
    }

    let cacheChanged = false;
    if (sourceMissingInputs.length) {
      const sourceProject = createSourceFileProgram(
        prepared,
        sourceMissingInputs.map(({ fileName }) => fileName),
      );
      programMs += sourceProject.programMs;
      signal?.throwIfAborted();
      const analysisStartedAt = performance.now();
      const freshSourceResults = analyzeProgram(
        sourceProject.program,
        sourceMissingInputs,
        {
          additionalDetectors,
          dependencyScope: "source-file",
          isRuleEnabled,
          signal,
        },
      );
      analysisMs += performance.now() - analysisStartedAt;

      freshSourceResults.forEach((result, index) => {
        const input = sourceMissingInputs[index];
        if (!input) {
          return;
        }
        sourceResultsByFile.set(input.fileName, result);
        if (cacheEligible) {
          const cacheKey = toCacheKey(rootDir, input.fileName);
          const signature = sourceSignatures[cacheKey];
          if (signature) {
            cachedSourceResults[cacheKey] = { result, signature };
            cacheChanged = true;
          }
        }
      });
    }

    const projectMissingInputs = inputs.filter((input) => {
      if (!projectRequiredByFile.get(input.fileName)) {
        return false;
      }
      const sourceResult = sourceResultsByFile.get(input.fileName);
      if (sourceResult?.diagnostics.length) {
        return false;
      }
      return !projectResultsByFile.has(input.fileName);
    });

    if (projectMissingInputs.length) {
      const project = createProjectProgram(prepared);
      programMs += project.programMs;
      signal?.throwIfAborted();
      const analysisStartedAt = performance.now();
      const freshProjectResults = analyzeProgram(
        project.program,
        projectMissingInputs,
        {
          additionalDetectors,
          dependencyScope: "project",
          isRuleEnabled,
          signal,
        },
      );
      analysisMs += performance.now() - analysisStartedAt;

      freshProjectResults.forEach((result, index) => {
        const input = projectMissingInputs[index];
        if (!input) {
          return;
        }
        projectResultsByFile.set(input.fileName, result);
        if (cacheEligible && projectSignature) {
          const cacheKey = toCacheKey(rootDir, input.fileName);
          cachedProjectResults[cacheKey] = {
            result,
            signature: projectSignature,
          };
          cacheChanged = true;
        }
      });
    }

    if (cacheEligible && projectIdentity && cacheChanged) {
      // Preserve entries outside the current target/Git scope. Their content
      // signatures are revalidated before reuse, so stale entries are harmless
      // while pruning here would make a one-file scan destroy a warm project cache.
      await writeProjectCache(cacheDirectory, projectIdentity, {
        projectResults: cachedProjectResults,
        sourceResults: cachedSourceResults,
      });
    }

    for (const input of inputs) {
      const sourceResult =
        sourceResultsByFile.get(input.fileName) ?? createEmptyAnalyzeResult();
      const projectResult = sourceResult.diagnostics.length
        ? null
        : (projectResultsByFile.get(input.fileName) ?? null);
      const result = mergeAnalyzeResults(sourceResult, projectResult);

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
      partialHits: cachePartialHits,
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
    ruleSelection: normalizedRuleSelection,
    scope,
    tsconfigPaths: [...tsconfigPaths].sort(),
    warnings,
  };

  if (profile) {
    result.profile = {
      analysisMs,
      cacheHits,
      cacheMisses,
      cachePartialHits,
      cacheMs,
      configMs: loadedConfig.loadMs,
      discoveryMs: discovery.discoveryMs,
      programMs,
      projectCacheHits,
      projectCacheMisses,
      rssMb: process.memoryUsage().rss / (1024 * 1024),
      sourceCacheHits,
      sourceCacheMisses,
      totalMs: performance.now() - totalStartedAt,
    };
  }

  return result;
};
