import path from "node:path";

import { loadAnalyzerConfig } from "./config.mjs";
import { checkPaths } from "./check.mjs";

const usage = `Coding Bible CLI

Usage:
  coding-bible check [path ...] [options]
  coding-bible config [--json] [--config path]
  coding-bible --help

Scan options:
  --changed             Check tracked/untracked working-tree changes.
  --staged              Check only staged files.
  --since <git-ref>     Check branch changes since a Git ref plus local changes.
  --config <path>       Use an explicit Coding Bible config file.
  --json                Print structured JSON.
  --profile             Include analyzer timing information.

Examples:
  coding-bible check src
  coding-bible check . --changed
  coding-bible check . --staged
  coding-bible check . --since origin/main
  coding-bible check . --config coding-bible.config.ts --profile
  coding-bible config --json
`;

const parseArguments = (args) => {
  if (!args.length || args.includes("--help") || args.includes("-h")) {
    return { command: "help" };
  }

  const [command, ...rest] = args;
  if (command !== "check" && command !== "config") {
    return { command: "invalid" };
  }

  const options = {
    command,
    configPath: undefined,
    json: false,
    profile: false,
    scope: { mode: "project" },
    targets: [],
  };
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

    if (argument === "--config") {
      const value = rest[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--config requires a file path.");
      }
      options.configPath = value;
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

  if (command === "config" && options.targets.length) {
    throw new Error("The config command does not accept source paths.");
  }

  return options;
};

const writeLine = (stream, value = "") => {
  stream.write(`${value}\n`);
};

const formatFinding = (finding) => {
  const { column, line } = finding.location;
  return [
    `${finding.filePath}:${line}:${column}  ${finding.severity.toUpperCase()}  ${finding.ruleId}`,
    `  ${finding.message}`,
    `  → ${finding.suggestion}`,
  ].join("\n");
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
  diagnostics,
  errors,
  filesScanned,
  findings,
  ruleIdsChecked,
  scope,
  warnings,
}) => {
  const fileLabel = filesScanned === 1 ? "file" : "files";

  if (diagnostics.length) {
    return `✗ Coding Bible found ${diagnostics.length} syntax issue${diagnostics.length === 1 ? "" : "s"} while checking ${filesScanned} ${fileLabel} (${formatScope(scope)}). Rule checks paused for malformed files.`;
  }

  if (!filesScanned) {
    return `✓ No supported source files matched the ${formatScope(scope)} scope.`;
  }

  if (!findings.length) {
    return `✓ No violations found among ${ruleIdsChecked.length} applicable automated rules in ${filesScanned} ${fileLabel} (${formatScope(scope)}).`;
  }

  const marker = errors ? "✗" : "⚠";
  return `${marker} Coding Bible found ${errors} error${errors === 1 ? "" : "s"} and ${warnings} warning${warnings === 1 ? "" : "s"} across ${ruleIdsChecked.length} applicable automated rules in ${filesScanned} ${fileLabel} (${formatScope(scope)}).`;
};

const formatProfile = (profile) =>
  [
    "Profile",
    `  config     ${profile.configMs.toFixed(1)} ms`,
    `  discovery  ${profile.discoveryMs.toFixed(1)} ms`,
    `  program    ${profile.programMs.toFixed(1)} ms`,
    `  analysis   ${profile.analysisMs.toFixed(1)} ms`,
    `  total      ${profile.totalMs.toFixed(1)} ms`,
    `  rss        ${profile.rssMb.toFixed(1)} MB`,
  ].join("\n");

const printConfig = async (options, { cwd, stdout }) => {
  const loaded = await loadAnalyzerConfig({
    cwd,
    configPath: options.configPath,
  });
  const displayPath = loaded.configPath
    ? path.relative(loaded.rootDir, loaded.configPath) ||
      path.basename(loaded.configPath)
    : null;
  const value = {
    configPath: displayPath,
    ...loaded.config,
  };

  if (options.json) {
    writeLine(stdout, JSON.stringify(value, null, 2));
  } else {
    writeLine(stdout, "Coding Bible configuration");
    writeLine(stdout, `  source   ${displayPath ?? "defaults"}`);
    writeLine(stdout, `  include  ${loaded.config.include.join(", ")}`);
    writeLine(stdout, `  ignore   ${loaded.config.ignore.length} patterns`);
    writeLine(
      stdout,
      `  tsconfig ${loaded.config.tsconfig === false ? "disabled" : (loaded.config.tsconfig ?? "auto")}`,
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

    const result = await checkPaths(options.targets, {
      configPath: options.configPath,
      cwd,
      profile: options.profile,
      scope: options.scope,
    });

    if (options.json) {
      writeLine(stdout, JSON.stringify(result, null, 2));
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
