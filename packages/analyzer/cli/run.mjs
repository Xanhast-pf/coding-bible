import { checkPaths } from "./check.mjs";

const usage = `Coding Bible CLI

Usage:
  coding-bible check [path ...] [--json]
  coding-bible --help

Examples:
  coding-bible check src
  coding-bible check apps/web packages/analyzer
  coding-bible check . --json
`;

const parseArguments = (args) => {
  if (!args.length || args.includes("--help") || args.includes("-h")) {
    return { command: "help", json: false, targets: [] };
  }

  const [command, ...rest] = args;

  if (command !== "check") {
    return { command: "invalid", json: false, targets: [] };
  }

  return {
    command,
    json: rest.includes("--json"),
    targets: rest.filter((argument) => argument !== "--json"),
  };
};

const writeLine = (stream, value = "") => {
  stream.write(`${value}\n`);
};

const formatFinding = (finding) => {
  const { column, line } = finding.location;
  return [
    `${finding.filePath}:${line}:${column}  ${finding.ruleId}`,
    `  ${finding.message}`,
    `  → ${finding.suggestion}`,
  ].join("\n");
};

const formatDiagnostic = (diagnostic) => {
  const { column, line } = diagnostic.location;
  return [
    `${diagnostic.filePath}:${line}:${column}  syntax`,
    `  ${diagnostic.message}`,
  ].join("\n");
};

const formatSummary = ({ diagnostics, filesScanned, findings, ruleIdsChecked }) => {
  const fileLabel = filesScanned === 1 ? "file" : "files";
  const findingLabel = findings.length === 1 ? "finding" : "findings";

  if (diagnostics.length) {
    return `✗ Coding Bible could not safely analyze ${diagnostics.length} syntax issue${diagnostics.length === 1 ? "" : "s"} in ${filesScanned} ${fileLabel}. Rule checks paused for malformed files.`;
  }

  if (!findings.length) {
    return `✓ No violations found among ${ruleIdsChecked.length} applicable automated rules in ${filesScanned} ${fileLabel}.`;
  }

  return `✗ Coding Bible found ${findings.length} ${findingLabel} across ${ruleIdsChecked.length} applicable automated rules in ${filesScanned} ${fileLabel}.`;
};

export const runCli = async (
  args,
  { cwd = process.cwd(), stderr = process.stderr, stdout = process.stdout } = {},
) => {
  const options = parseArguments(args);

  if (options.command === "help") {
    stdout.write(usage);
    return 0;
  }

  if (options.command === "invalid") {
    stderr.write(usage);
    return 2;
  }

  try {
    const result = await checkPaths(options.targets, { cwd });

    if (options.json) {
      writeLine(stdout, JSON.stringify(result, null, 2));
    } else {
      writeLine(stdout, formatSummary(result));

      if (result.diagnostics.length) {
        writeLine(stdout);
        writeLine(stdout, result.diagnostics.map(formatDiagnostic).join("\n\n"));
      }

      if (result.findings.length) {
        writeLine(stdout);
        writeLine(stdout, result.findings.map(formatFinding).join("\n\n"));
      }
    }

    return result.diagnostics.length || result.findings.length ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeLine(stderr, `Coding Bible could not analyze the requested path: ${message}`);
    return 2;
  }
};
