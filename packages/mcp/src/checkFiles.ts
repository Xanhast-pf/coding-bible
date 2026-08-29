import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { resolveInsideRoot, toRootRelativePath } from "./pathSafety.ts";

export interface CheckFilesInput {
  paths?: readonly string[];
  configPath?: string;
  ignoreBaseline?: boolean;
}

interface AnalyzerReportSummary {
  diagnostics: number;
  errors: number;
  filesAnalyzed: number;
  findings: number;
  rulesChecked: number;
  warnings: number;
}

export interface AnalyzerReport {
  schemaVersion: 1;
  summary: AnalyzerReportSummary;
  diagnostics: readonly unknown[];
  findings: readonly unknown[];
  [key: string]: unknown;
}

export interface CheckFilesResult {
  schemaVersion: 1;
  kind: "file-check";
  root: string;
  targets: readonly string[];
  analyzer: AnalyzerReport;
}

const analyzerCliPath = fileURLToPath(
  import.meta.resolve("@coding-bible/analyzer/bin"),
);
const maximumOutputBytes = 32 * 1024 * 1024;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readNumber = (value: unknown, key: string) => {
  if (!isRecord(value) || typeof value[key] !== "number") {
    throw new Error(`Analyzer JSON report is missing numeric summary.${key}.`);
  }

  return value[key];
};

export const parseAnalyzerReport = (value: string): AnalyzerReport => {
  const parsed = JSON.parse(value) as unknown;

  if (!isRecord(parsed) || parsed.schemaVersion !== 1) {
    throw new Error("Analyzer returned an unsupported JSON report.");
  }
  if (!Array.isArray(parsed.findings) || !Array.isArray(parsed.diagnostics)) {
    throw new Error("Analyzer JSON report is missing findings or diagnostics.");
  }

  const summary = parsed.summary;
  const normalizedSummary: AnalyzerReportSummary = {
    diagnostics: readNumber(summary, "diagnostics"),
    errors: readNumber(summary, "errors"),
    filesAnalyzed: readNumber(summary, "filesAnalyzed"),
    findings: readNumber(summary, "findings"),
    rulesChecked: readNumber(summary, "rulesChecked"),
    warnings: readNumber(summary, "warnings"),
  };

  return {
    ...parsed,
    schemaVersion: 1,
    summary: normalizedSummary,
    diagnostics: parsed.diagnostics,
    findings: parsed.findings,
  };
};

export const buildAnalyzerArguments = (
  input: CheckFilesInput,
  rootDirectory: string,
) => {
  const requestedPaths = input.paths?.length ? input.paths : ["."];
  const targets = requestedPaths.map((requestedPath) =>
    toRootRelativePath(
      rootDirectory,
      resolveInsideRoot(rootDirectory, requestedPath, "Check path"),
    ),
  );
  const argumentsList = [
    analyzerCliPath,
    "check",
    ...targets,
    "--json",
    "--no-cache",
  ];

  if (input.ignoreBaseline) {
    argumentsList.push("--no-baseline");
  }

  if (input.configPath) {
    argumentsList.push(
      "--config",
      toRootRelativePath(
        rootDirectory,
        resolveInsideRoot(rootDirectory, input.configPath, "Config path"),
      ),
    );
  }

  return { argumentsList, targets };
};

const runAnalyzer = async (
  argumentsList: readonly string[],
  rootDirectory: string,
  signal?: AbortSignal,
) =>
  new Promise<{ exitCode: number; stderr: string; stdout: string }>(
    (resolve, reject) => {
      const child = spawn(process.execPath, argumentsList, {
        cwd: rootDirectory,
        stdio: ["ignore", "pipe", "pipe"],
        ...(signal ? { signal } : {}),
      });
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];
      let outputBytes = 0;
      let settled = false;

      const fail = (error: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        child.kill();
        reject(error);
      };

      const append = (target: Buffer[], chunk: Buffer) => {
        if (settled) {
          return;
        }

        outputBytes += chunk.length;
        if (outputBytes > maximumOutputBytes) {
          fail(
            new Error(
              "Analyzer output exceeded the MCP 32 MiB safety limit. Narrow the requested paths.",
            ),
          );
          return;
        }
        target.push(chunk);
      };

      child.stdout.on("data", (chunk: Buffer) => {
        append(stdoutChunks, chunk);
      });
      child.stderr.on("data", (chunk: Buffer) => {
        append(stderrChunks, chunk);
      });
      child.on("error", (error) => fail(error));
      child.on("close", (exitCode) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve({
          exitCode: exitCode ?? 2,
          stderr: Buffer.concat(stderrChunks).toString("utf8"),
          stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        });
      });
    },
  );

export const checkFiles = async (
  input: CheckFilesInput,
  {
    rootDirectory = process.cwd(),
    signal,
  }: {
    rootDirectory?: string;
    signal?: AbortSignal;
  } = {},
): Promise<CheckFilesResult> => {
  const { argumentsList, targets } = buildAnalyzerArguments(
    input,
    rootDirectory,
  );
  const result = await runAnalyzer(argumentsList, rootDirectory, signal);

  if (result.exitCode !== 0 && result.exitCode !== 1) {
    throw new Error(
      result.stderr.trim() ||
        `Coding Bible analyzer exited with status ${result.exitCode}.`,
    );
  }

  return {
    schemaVersion: 1,
    kind: "file-check",
    root: ".",
    targets,
    analyzer: parseAnalyzerReport(result.stdout),
  };
};
