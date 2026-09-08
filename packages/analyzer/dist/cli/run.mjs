import path from "node:path";

import {
  classifyBaseline,
  loadBaseline,
  resolveBaselinePath,
  writeBaseline,
  writeBaselineEntries,
} from "./baseline.mjs";
import { loadAnalyzerConfig } from "./config.mjs";
import { assertBaselineInsideBoundary, checkPaths } from "./check.mjs";
import { writeAnalysisArtifacts } from "./fixes.mjs";

const usage = `Coding Bible CLI

Usage:
  coding-bible check [path ...] [options]
  coding-bible baseline create [path ...] [options]
  coding-bible baseline status [path ...] [options]
  coding-bible baseline prune [path ...] [options]
  coding-bible config [--json] [--config path]
  coding-bible --help

Scan options:
  --changed             Check tracked/untracked working-tree changes.
  --staged              Check only staged files.
  --since <git-ref>     Check branch changes since a Git ref plus local changes.
  --config <path>       Use an explicit Coding Bible config file.
  --boundary-root <path>
                        Restrict config/source discovery to this filesystem root.
  --rules <id,...>      Run only the listed automated rule IDs.
  --exclude-rules <id,...>
                        Skip the listed automated rule IDs.
  --json                Print the versioned analyzer report JSON.
  --profile             Include analyzer timing information.
  --no-cache            Disable the project result cache for this run.
  --clear-cache         Clear the configured cache before checking.
  --no-baseline         Ignore the configured baseline for this run.
  --baseline-file <path>
                        Override the baseline path.
  --report              Write .coding-bible/report.json.
  --patch               Write .coding-bible/safe-fixes.patch.
  --include-review-fixes
                        Also write .coding-bible/review-fixes.patch.
  --review-brief        Write .coding-bible/review-brief.md.
  --fix-pack            Write the full remediation bundle (report, patches, Fix Pack, Review Brief).
  --output-dir <path>   Override the artifact directory (default: .coding-bible).

Examples:
  coding-bible check src
  coding-bible check . --changed
  coding-bible check . --staged
  coding-bible check . --since origin/main
  coding-bible check . --profile
  coding-bible check . --no-cache
  coding-bible baseline create .
  coding-bible baseline status .
  coding-bible baseline prune .
  coding-bible check . --no-baseline
  coding-bible check . --report --patch
  coding-bible check . --fix-pack
  coding-bible check . --json
  coding-bible config --json
`;

const createDefaultOptions = (command) => ({
  action: null,
  baseline: true,
  baselinePath: undefined,
  boundaryRoot: undefined,
  cache: true,
  clearCache: false,
  command,
  configPath: undefined,
  fixPack: false,
  includeReviewFixes: false,
  json: false,
  outputDirectory: ".coding-bible",
  ruleSelection: {},
  patch: false,
  profile: false,
  report: false,
  reviewBrief: false,
  scope: { mode: "project" },
  targets: [],
});

const parseRuleList = (value, optionName) => {
  const ruleIds = value
    .split(",")
    .map((ruleId) => ruleId.trim())
    .filter(Boolean);
  if (!ruleIds.length) {
    throw new Error(`${optionName} requires at least one rule ID.`);
  }
  return ruleIds;
};

const parseArguments = (args) => {
  if (!args.length || args.includes("--help") || args.includes("-h")) {
    return { command: "help" };
  }

  const [command, ...originalRest] = args;
  if (command !== "check" && command !== "config" && command !== "baseline") {
    return { command: "invalid" };
  }

  const options = createDefaultOptions(command);
  const rest = [...originalRest];
  if (command === "baseline") {
    options.action = rest.shift() ?? null;
    if (!["create", "status", "prune"].includes(options.action)) {
      throw new Error(
        'The baseline command supports "create", "status", and "prune".',
      );
    }
    options.baseline = false;
  }

  let scopeCount = 0;
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];

    if (argument === "--json") {
      options.json = true;
      continue;
    }
    if (argument === "--profile") {
      options.profile = true;
      continue;
    }
    if (argument === "--report") {
      options.report = true;
      continue;
    }
    if (argument === "--review-brief") {
      options.reviewBrief = true;
      continue;
    }
    if (argument === "--fix-pack") {
      options.fixPack = true;
      options.includeReviewFixes = true;
      options.patch = true;
      options.report = true;
      options.reviewBrief = true;
      continue;
    }
    if (argument === "--patch") {
      options.patch = true;
      continue;
    }
    if (argument === "--include-review-fixes") {
      options.includeReviewFixes = true;
      continue;
    }
    if (argument === "--no-cache") {
      options.cache = false;
      continue;
    }
    if (argument === "--clear-cache") {
      options.clearCache = true;
      continue;
    }
    if (argument === "--no-baseline") {
      options.baseline = false;
      continue;
    }
    if (argument === "--baseline-file") {
      const value = rest[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--baseline-file requires a file path.");
      }
      options.baselinePath = value;
      index += 1;
      continue;
    }
    if (argument === "--output-dir") {
      const value = rest[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--output-dir requires a directory path.");
      }
      options.outputDirectory = value;
      index += 1;
      continue;
    }
    if (argument === "--config") {
      const value = rest[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--config requires a file path.");
      }
      options.configPath = value;
      index += 1;
      continue;
    }
    if (argument === "--boundary-root") {
      const value = rest[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--boundary-root requires a directory path.");
      }
      options.boundaryRoot = value;
      index += 1;
      continue;
    }
    if (argument === "--rules" || argument === "--exclude-rules") {
      const value = rest[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${argument} requires a comma-separated rule list.`);
      }
      const key = argument === "--rules" ? "include" : "exclude";
      options.ruleSelection = {
        ...options.ruleSelection,
        [key]: parseRuleList(value, argument),
      };
      index += 1;
      continue;
    }
    if (argument === "--changed") {
      options.scope = { mode: "changed" };
      scopeCount += 1;
      continue;
    }
    if (argument === "--staged") {
      options.scope = { mode: "staged" };
      scopeCount += 1;
      continue;
    }
    if (argument === "--since") {
      const value = rest[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--since requires a Git ref.");
      }
      options.scope = { mode: "since", ref: value };
      scopeCount += 1;
      index += 1;
      continue;
    }
    if (argument.startsWith("--")) {
      throw new Error(`Unknown option: ${argument}`);
    }
    options.targets.push(argument);
  }

  if (scopeCount > 1) {
    throw new Error("Use only one of --changed, --staged, or --since.");
  }
  if (options.includeReviewFixes && !options.patch) {
    throw new Error("--include-review-fixes requires --patch.");
  }
  if (!options.baseline && options.baselinePath && command === "check") {
    throw new Error("--baseline-file cannot be combined with --no-baseline.");
  }

  if (command === "config") {
    if (options.targets.length) {
      throw new Error("The config command does not accept source paths.");
    }
    if (
      options.report ||
      options.reviewBrief ||
      options.fixPack ||
      options.patch ||
      options.includeReviewFixes ||
      options.outputDirectory !== ".coding-bible" ||
      options.profile ||
      !options.cache ||
      options.clearCache ||
      !options.baseline ||
      options.baselinePath ||
      options.ruleSelection.include ||
      options.ruleSelection.exclude ||
      scopeCount
    ) {
      throw new Error(
        "Report, patch, cache, baseline, profile, rule-selection, and scan-scope options are " +
          "only valid for check/baseline.",
      );
    }
  }

  if (command === "baseline") {
    if (scopeCount) {
      throw new Error(
        "Baseline lifecycle commands require a project/path scan, not a Git diff scope.",
      );
    }
    if (
      options.report ||
      options.reviewBrief ||
      options.fixPack ||
      options.patch ||
      options.includeReviewFixes
    ) {
      throw new Error(
        "Report, patch, Review Brief, and Fix Pack options are not valid for baseline lifecycle commands.",
      );
    }
    if (options.json && options.action !== "status") {
      throw new Error("--json is supported only by baseline status.");
    }
  }

  return options;
};

const writeLine = (stream, value = "") => {
  stream.write(`${value}\n`);
};

const formatFinding = (finding) => {
  const { column, line } = finding.location;
  const fixLabel = finding.fix?.edits?.length
    ? finding.fix.safety === "safe"
      ? "  ✓ Safe fix available"
      : "  ⚠ Review fix available"
    : null;

  const contextLabel = finding.contextNote
    ? finding.confidence === "contextual"
      ? `  ! Context required: ${finding.contextNote}`
      : `  i Analyzer note: ${finding.contextNote}`
    : null;

  return [
    `${finding.filePath}:${line}:${column}  ${finding.severity.toUpperCase()}  ${finding.ruleId}  ` +
      `${finding.impact.toUpperCase()} impact · ${finding.confidence.toUpperCase()} confidence`,
    `  ${finding.message}`,
    `  → ${finding.suggestion}`,
    contextLabel,
    fixLabel,
  ]
    .filter(Boolean)
    .join("\n");
};

const formatDiagnostic = (diagnostic) => {
  const { column, line } = diagnostic.location;
  return [
    `${diagnostic.filePath}:${line}:${column}  SYNTAX`,
    `  ${diagnostic.message}`,
  ].join("\n");
};

const formatScope = (scope) => {
  if (scope.mode === "since") {
    return `since ${scope.ref}`;
  }
  return scope.mode;
};

const formatSummary = ({
  baseline,
  diagnostics,
  errors,
  filesScanned,
  findings,
  ruleIdsChecked,
  scope,
  warnings,
}) => {
  const fileLabel = filesScanned === 1 ? "file" : "files";
  const baselineSuffix = baseline?.suppressed
    ? ` ${baseline.suppressed} known baseline finding${
        baseline.suppressed === 1 ? " was" : "s were"
      } suppressed.`
    : "";

  if (diagnostics.length) {
    return (
      `✗ Coding Bible found ${diagnostics.length} syntax issue${
        diagnostics.length === 1 ? "" : "s"
      } while checking ${filesScanned} ${fileLabel} (${formatScope(scope)}). ` +
      "Rule checks paused for malformed files."
    );
  }
  if (!filesScanned) {
    return `✓ No supported source files matched the ${formatScope(scope)} scope.`;
  }
  if (!findings.length) {
    const status = baseline ? "No new violations" : "No violations";
    return (
      `✓ ${status} found among ${ruleIdsChecked.length} applicable automated ` +
      `rules in ${filesScanned} ${fileLabel} (${formatScope(scope)}).${baselineSuffix}`
    );
  }
  const marker = errors ? "✗" : "⚠";
  return (
    `${marker} Coding Bible found ${errors} error${errors === 1 ? "" : "s"} and ` +
    `${warnings} warning${warnings === 1 ? "" : "s"} across ` +
    `${ruleIdsChecked.length} applicable automated rules in ${filesScanned} ` +
    `${fileLabel} (${formatScope(scope)}).${baselineSuffix}`
  );
};

const formatProfile = (profile) =>
  [
    "Profile",
    `  config     ${profile.configMs.toFixed(1)} ms`,
    `  discovery  ${profile.discoveryMs.toFixed(1)} ms`,
    `  cache      ${profile.cacheMs.toFixed(1)} ms (` +
      `${profile.cacheHits} hits, ${profile.cacheMisses} misses)`,
    `  program    ${profile.programMs.toFixed(1)} ms`,
    `  analysis   ${profile.analysisMs.toFixed(1)} ms`,
    `  total      ${profile.totalMs.toFixed(1)} ms`,
    `  rss        ${profile.rssMb.toFixed(1)} MB`,
  ].join("\n");

const printConfig = async (options, { cwd, stdout }) => {
  const loaded = await loadAnalyzerConfig({
    cwd,
    configPath: options.configPath,
    boundaryRoot: options.boundaryRoot,
  });
  const displayPath = loaded.configPath
    ? path.relative(loaded.rootDir, loaded.configPath) ||
      path.basename(loaded.configPath)
    : null;
  const value = { configPath: displayPath, ...loaded.config };

  if (options.json) {
    writeLine(stdout, JSON.stringify(value, null, 2));
  } else {
    writeLine(stdout, "Coding Bible configuration");
    writeLine(stdout, `  source   ${displayPath ?? "defaults"}`);
    writeLine(stdout, `  include  ${loaded.config.include.join(", ")}`);
    writeLine(stdout, `  ignore   ${loaded.config.ignore.length} patterns`);
    writeLine(
      stdout,
      `  cache    ${
        loaded.config.cache === false
          ? "disabled"
          : (loaded.config.cache ?? ".coding-bible/cache")
      }`,
    );
    writeLine(
      stdout,
      `  baseline ${
        loaded.config.baseline === false
          ? "disabled"
          : (loaded.config.baseline ?? ".coding-bible-baseline.json")
      }`,
    );
    writeLine(
      stdout,
      `  tsconfig ${
        loaded.config.tsconfig === false
          ? "disabled"
          : (loaded.config.tsconfig ?? "auto")
      }`,
    );
    writeLine(
      stdout,
      `  rules    ${Object.keys(loaded.config.rules ?? {}).length} overrides`,
    );
    writeLine(
      stdout,
      `  packs    ${Object.keys(loaded.config.packs ?? {}).length} overrides`,
    );
  }
  return 0;
};

const createBaseline = async (options, { cwd, stdout }) => {
  const result = await checkPaths(options.targets, {
    baseline: false,
    boundaryRoot: options.boundaryRoot,
    cache: options.cache,
    clearCache: options.clearCache,
    configPath: options.configPath,
    cwd,
    profile: options.profile,
    ruleSelection: options.ruleSelection,
  });
  if (result.diagnostics.length) {
    writeLine(stdout, formatSummary(result));
    writeLine(stdout);
    writeLine(stdout, result.diagnostics.map(formatDiagnostic).join("\n\n"));
    return 1;
  }

  const loaded = await loadAnalyzerConfig({
    cwd,
    configPath: options.configPath,
    boundaryRoot: options.boundaryRoot,
  });
  const requestedFilePath = resolveBaselinePath(loaded.rootDir, loaded.config, {
    enabled: true,
    overridePath: options.baselinePath,
  });
  const filePath = await assertBaselineInsideBoundary(
    requestedFilePath,
    loaded.boundaryRoot,
  );
  if (!filePath) {
    throw new Error(
      "Baseline output is disabled by config. Set baseline to a path or use --baseline-file.",
    );
  }
  const count = await writeBaseline(result, filePath);
  const displayPath =
    path.relative(loaded.rootDir, filePath) || path.basename(filePath);
  writeLine(
    stdout,
    `✓ Wrote Coding Bible baseline with ${count} finding${
      count === 1 ? "" : "s"
    } to ${displayPath}.`,
  );
  if (options.profile && result.profile) {
    writeLine(stdout);
    writeLine(stdout, formatProfile(result.profile));
  }
  return 0;
};

const inspectBaseline = async (options, { cwd }) => {
  const result = await checkPaths(options.targets, {
    baseline: false,
    boundaryRoot: options.boundaryRoot,
    cache: options.cache,
    clearCache: options.clearCache,
    configPath: options.configPath,
    cwd,
    profile: options.profile,
    ruleSelection: options.ruleSelection,
  });
  const loaded = await loadAnalyzerConfig({
    cwd,
    configPath: options.configPath,
    boundaryRoot: options.boundaryRoot,
  });
  const requestedFilePath = resolveBaselinePath(loaded.rootDir, loaded.config, {
    enabled: true,
    overridePath: options.baselinePath,
  });
  const filePath = await assertBaselineInsideBoundary(
    requestedFilePath,
    loaded.boundaryRoot,
  );
  const baseline = await loadBaseline(filePath);
  return {
    baseline,
    classification: classifyBaseline(result.findings, baseline),
    filePath,
    loaded,
    result,
  };
};

const baselineStatus = async (options, { cwd, stdout }) => {
  const inspected = await inspectBaseline(options, { cwd });
  if (inspected.result.diagnostics.length) {
    writeLine(stdout, formatSummary(inspected.result));
    return 1;
  }
  const { active, newFindings, stale } = inspected.classification;
  const displayPath = inspected.filePath
    ? path.relative(inspected.loaded.rootDir, inspected.filePath) ||
      path.basename(inspected.filePath)
    : null;
  const payload = {
    schemaVersion: 1,
    baseline: inspected.baseline
      ? {
          generatedAt: inspected.baseline.generatedAt ?? null,
          path: displayPath,
          entries: inspected.baseline.findings.length,
        }
      : null,
    active: active.length,
    stale: stale.length,
    new: newFindings.length,
  };
  if (options.json) {
    writeLine(stdout, JSON.stringify(payload, null, 2));
  } else {
    writeLine(stdout, "Coding Bible baseline status");
    writeLine(stdout, `  baseline ${displayPath ?? "not configured"}`);
    writeLine(stdout, `  active   ${payload.active}`);
    writeLine(stdout, `  stale    ${payload.stale}`);
    writeLine(stdout, `  new      ${payload.new}`);
  }
  return 0;
};

const pruneBaseline = async (options, { cwd, stdout }) => {
  const inspected = await inspectBaseline(options, { cwd });
  if (inspected.result.diagnostics.length) {
    writeLine(stdout, formatSummary(inspected.result));
    return 1;
  }
  if (!inspected.filePath || !inspected.baseline) {
    throw new Error("Cannot prune because no Coding Bible baseline exists.");
  }
  const { active, newFindings, stale } = inspected.classification;
  await writeBaselineEntries(active, inspected.filePath);
  const displayPath =
    path.relative(inspected.loaded.rootDir, inspected.filePath) ||
    path.basename(inspected.filePath);
  writeLine(
    stdout,
    `✓ Pruned ${stale.length} stale baseline entr${stale.length === 1 ? "y" : "ies"} from ${displayPath}; ` +
      `${active.length} active entr${active.length === 1 ? "y" : "ies"} remain and ${newFindings.length} new finding${newFindings.length === 1 ? " was" : "s were"} not baselined.`,
  );
  return 0;
};

export const runCli = async (
  args,
  {
    cwd = process.cwd(),
    stderr = process.stderr,
    stdout = process.stdout,
  } = {},
) => {
  let options;
  try {
    options = parseArguments(args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeLine(stderr, `Coding Bible CLI: ${message}`);
    return 2;
  }

  if (options.command === "help") {
    stdout.write(usage);
    return 0;
  }
  if (options.command === "invalid") {
    stderr.write(usage);
    return 2;
  }

  try {
    if (options.command === "config") {
      return await printConfig(options, { cwd, stdout });
    }
    if (options.command === "baseline") {
      if (options.action === "create")
        return await createBaseline(options, { cwd, stdout });
      if (options.action === "status")
        return await baselineStatus(options, { cwd, stdout });
      return await pruneBaseline(options, { cwd, stdout });
    }

    const result = await checkPaths(options.targets, {
      baseline: options.baseline,
      baselinePath: options.baselinePath,
      boundaryRoot: options.boundaryRoot,
      cache: options.cache,
      clearCache: options.clearCache,
      configPath: options.configPath,
      cwd,
      profile: options.profile,
      ruleSelection: options.ruleSelection,
      scope: options.scope,
    });
    const artifacts =
      options.json ||
      options.report ||
      options.patch ||
      options.reviewBrief ||
      options.fixPack
        ? await writeAnalysisArtifacts(result, {
            fixPack: options.fixPack,
            includeReviewFixes: options.includeReviewFixes,
            outputDirectory: options.outputDirectory,
            patch: options.patch,
            report: options.report,
            reviewBrief: options.reviewBrief,
          })
        : { files: [], report: null };

    if (options.json) {
      writeLine(stdout, JSON.stringify(artifacts.report, null, 2));
    } else {
      writeLine(stdout, formatSummary(result));
      if (result.diagnostics.length) {
        writeLine(stdout);
        writeLine(
          stdout,
          result.diagnostics.map(formatDiagnostic).join("\n\n"),
        );
      }
      if (result.findings.length) {
        writeLine(stdout);
        writeLine(stdout, result.findings.map(formatFinding).join("\n\n"));
      }
      if (result.profile) {
        writeLine(stdout);
        writeLine(stdout, formatProfile(result.profile));
      }
      if (artifacts.files.length) {
        writeLine(stdout);
        writeLine(stdout, "Generated");
        for (const filePath of artifacts.files) {
          writeLine(stdout, `  ${filePath}`);
        }
      }
    }

    return result.diagnostics.length || result.errors ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeLine(
      stderr,
      `Coding Bible could not analyze the requested project: ${message}`,
    );
    return 2;
  }
};
