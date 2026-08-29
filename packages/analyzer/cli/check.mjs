import path from "node:path";

import { analyzeProgram } from "../src/index.ts";
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
} from "./project.mjs";

const toRelativePath = (cwd, filePath) => {
  const relativePath = path.relative(cwd, filePath);
  return relativePath || path.basename(filePath);
};

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

export const checkPaths = async (
  targets,
  {
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

  if (!discovery.files.length) {
    const result = {
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
        configMs: loadedConfig.loadMs,
        discoveryMs: discovery.discoveryMs,
        programMs: 0,
        rssMb: process.memoryUsage().rss / (1024 * 1024),
        totalMs: performance.now() - totalStartedAt,
      };
    }

    return result;
  }

  signal?.throwIfAborted();
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

  for (const plan of projectPlans) {
    const project = createProjectProgram(plan, { cwd: rootDir });
    programMs += project.programMs;
    signal?.throwIfAborted();
    projectFiles += project.projectFiles;
    if (project.tsconfigPath) {
      tsconfigPaths.add(toRelativePath(rootDir, project.tsconfigPath));
    }

    const inputs = project.files.flatMap((filePath) => {
      const language = languageByExtension.get(path.extname(filePath));
      return language ? [{ fileName: filePath, language }] : [];
    });
    filesScanned += inputs.length;
    const fileAnalysisStartedAt = performance.now();
    const results = analyzeProgram(project.program, inputs, {
      isRuleEnabled: resolver.isRuleEnabled,
      signal,
    });
    analysisMs += performance.now() - fileAnalysisStartedAt;

    results.forEach((result, index) => {
      const input = inputs[index];
      if (!input) {
        return;
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
    });
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

  const errors = findings.filter(({ severity }) => severity === "error").length;
  const warnings = findings.filter(
    ({ severity }) => severity === "warning",
  ).length;
  const result = {
    checksRun,
    configPath: loadedConfig.configPath
      ? toRelativePath(rootDir, loadedConfig.configPath)
      : null,
    diagnostics,
    errors,
    filesDiscovered: discovery.discovered.length,
    filesScanned,
    findings,
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
      configMs: loadedConfig.loadMs,
      discoveryMs: discovery.discoveryMs,
      programMs,
      rssMb: process.memoryUsage().rss / (1024 * 1024),
      totalMs: performance.now() - totalStartedAt,
    };
  }

  return result;
};
