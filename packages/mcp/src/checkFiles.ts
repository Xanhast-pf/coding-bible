import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  analyzerFindingConfidences,
  analyzerFindingImpacts,
  type AnalyzerReportDiagnosticV1,
  type AnalyzerReportFindingV1,
  type AnalyzerReportFixV1,
  type AnalyzerReportLocation as AnalyzerReportLocationV1,
  type AnalyzerReportSummaryV1,
  type AnalyzerReportV1,
} from "@coding-bible/analyzer";

import { codingBibleCanonicalUrl } from "./constants.ts";
import {
  resolveExistingInsideRoot,
  resolveRootDirectory,
  toRootRelativePath,
} from "./pathSafety.ts";
import {
  createRuleReferences,
  type McpRuleReference,
} from "./ruleReference.ts";

export interface CheckFilesInput {
  paths?: readonly string[];
  configPath?: string;
  ignoreBaseline?: boolean;
}

export type AnalyzerReportDiagnostic = AnalyzerReportDiagnosticV1;
export type AnalyzerReportFinding = AnalyzerReportFindingV1;
export type AnalyzerReportSummary = AnalyzerReportSummaryV1;
export type AnalyzerReport = AnalyzerReportV1;
export type AnalyzerReportLocation = AnalyzerReportLocationV1;

export interface CheckFilesResult {
  schemaVersion: 1;
  kind: "file-check";
  root: string;
  targets: readonly string[];
  analyzer: AnalyzerReport;
  ruleReferences: readonly McpRuleReference[];
  coverageNote: string;
}

const analyzerCliPath = fileURLToPath(
  import.meta.resolve("@coding-bible/analyzer/bin"),
);
const maximumOutputBytes = 32 * 1024 * 1024;
const findingConfidences = new Set<string>(analyzerFindingConfidences);
const findingImpacts = new Set<string>(analyzerFindingImpacts);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readNumber = (value: unknown, key: string) => {
  if (!isRecord(value) || typeof value[key] !== "number") {
    throw new Error(`Analyzer JSON report is missing numeric summary.${key}.`);
  }

  return value[key];
};

const readString = (value: unknown, key: string) => {
  if (!isRecord(value) || typeof value[key] !== "string") {
    throw new Error(`Analyzer JSON report is missing string ${key}.`);
  }

  return value[key];
};

const readNullableString = (value: unknown, key: string) => {
  if (!isRecord(value)) {
    throw new Error(`Analyzer JSON report is missing ${key}.`);
  }
  const candidate = value[key];
  if (candidate !== null && typeof candidate !== "string") {
    throw new Error(`Analyzer JSON report contains invalid ${key}.`);
  }
  return candidate;
};

const readLocation = (value: unknown): AnalyzerReportLocation => ({
  line: readNumber(value, "line"),
  column: readNumber(value, "column"),
  endLine: readNumber(value, "endLine"),
  endColumn: readNumber(value, "endColumn"),
});

const readDiagnostic = (value: unknown): AnalyzerReportDiagnostic => {
  if (!isRecord(value)) {
    throw new Error("Analyzer JSON report contains an invalid diagnostic.");
  }

  return {
    excerpt: readString(value, "excerpt"),
    file: readString(value, "file"),
    location: readLocation(value.location),
    message: readString(value, "message"),
  };
};

const readFix = (value: unknown): AnalyzerReportFixV1 => {
  if (!isRecord(value) || typeof value.available !== "boolean") {
    throw new Error("Analyzer JSON report contains an invalid finding fix.");
  }
  const safety = readString(value, "safety");
  if (safety !== "none" && safety !== "safe" && safety !== "review") {
    throw new Error("Analyzer JSON report contains an invalid fix safety.");
  }
  const description = value.description;
  const patch = value.patch;
  const title = value.title;
  if (description !== undefined && typeof description !== "string") {
    throw new Error(
      "Analyzer JSON report contains an invalid fix description.",
    );
  }
  if (patch !== undefined && patch !== null && typeof patch !== "string") {
    throw new Error("Analyzer JSON report contains an invalid fix patch.");
  }
  if (title !== undefined && typeof title !== "string") {
    throw new Error("Analyzer JSON report contains an invalid fix title.");
  }
  return {
    available: value.available,
    ...(description === undefined ? {} : { description }),
    ...(patch === undefined ? {} : { patch }),
    safety,
    ...(title === undefined ? {} : { title }),
  };
};

const readFinding = (value: unknown): AnalyzerReportFinding => {
  if (!isRecord(value)) {
    throw new Error("Analyzer JSON report contains an invalid finding.");
  }

  const severity = readString(value, "severity");
  if (severity !== "error" && severity !== "warning") {
    throw new Error(
      "Analyzer JSON report contains an invalid finding severity.",
    );
  }
  const confidence = readString(value, "confidence");
  if (!findingConfidences.has(confidence)) {
    throw new Error(
      "Analyzer JSON report contains invalid finding confidence.",
    );
  }
  const impact = readString(value, "impact");
  if (!findingImpacts.has(impact)) {
    throw new Error("Analyzer JSON report contains invalid finding impact.");
  }

  return {
    confidence: confidence as AnalyzerReportFinding["confidence"],
    contextNote: readNullableString(value, "contextNote"),
    detectorId: readString(value, "detectorId"),
    excerpt: readString(value, "excerpt"),
    file: readString(value, "file"),
    fingerprint: readString(value, "fingerprint"),
    fix: readFix(value.fix),
    impact: impact as AnalyzerReportFinding["impact"],
    location: readLocation(value.location),
    message: readString(value, "message"),
    ruleId: readString(value, "ruleId"),
    ruleRationale: readNullableString(value, "ruleRationale"),
    ruleTitle: readNullableString(value, "ruleTitle"),
    ruleUrl: readNullableString(value, "ruleUrl"),
    severity,
    suggestion: readString(value, "suggestion"),
  };
};

const readCountBreakdown = <TKey extends string>(
  value: unknown,
  keys: readonly TKey[],
): Readonly<Record<TKey, number>> =>
  Object.fromEntries(
    keys.map((key) => [key, readNumber(value, key)]),
  ) as Record<TKey, number>;

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
    baselineSuppressed: readNumber(summary, "baselineSuppressed"),
    cacheHits: readNumber(summary, "cacheHits"),
    cacheMisses: readNumber(summary, "cacheMisses"),
    diagnostics: readNumber(summary, "diagnostics"),
    errors: readNumber(summary, "errors"),
    filesDiscovered: readNumber(summary, "filesDiscovered"),
    filesAnalyzed: readNumber(summary, "filesAnalyzed"),
    findings: readNumber(summary, "findings"),
    reviewFixes: readNumber(summary, "reviewFixes"),
    rulesChecked: readNumber(summary, "rulesChecked"),
    safeFixes: readNumber(summary, "safeFixes"),
    warnings: readNumber(summary, "warnings"),
    confidence: readCountBreakdown(
      summary && isRecord(summary) ? summary.confidence : null,
      analyzerFindingConfidences,
    ),
    impact: readCountBreakdown(
      summary && isRecord(summary) ? summary.impact : null,
      analyzerFindingImpacts,
    ),
  };

  return {
    ...parsed,
    schemaVersion: 1,
    summary: normalizedSummary,
    diagnostics: parsed.diagnostics.map(readDiagnostic),
    findings: parsed.findings.map(readFinding),
  };
};

export const buildAnalyzerArguments = async (
  input: CheckFilesInput,
  rootDirectory: string,
) => {
  const canonicalRoot = await resolveRootDirectory(rootDirectory);
  const requestedPaths = input.paths?.length ? input.paths : ["."];
  const targets = await Promise.all(
    requestedPaths.map(async (requestedPath) =>
      toRootRelativePath(
        canonicalRoot,
        await resolveExistingInsideRoot(
          canonicalRoot,
          requestedPath,
          "Check path",
        ),
      ),
    ),
  );
  const argumentsList = [
    analyzerCliPath,
    "check",
    ...targets,
    "--json",
    "--no-cache",
    "--boundary-root",
    ".",
  ];

  if (input.ignoreBaseline) {
    argumentsList.push("--no-baseline");
  }

  if (input.configPath) {
    argumentsList.push(
      "--config",
      toRootRelativePath(
        canonicalRoot,
        await resolveExistingInsideRoot(
          canonicalRoot,
          input.configPath,
          "Config path",
        ),
      ),
    );
  }

  return { argumentsList, canonicalRoot, targets };
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
    canonicalBaseUrl = codingBibleCanonicalUrl,
    rootDirectory = process.cwd(),
    signal,
  }: {
    canonicalBaseUrl?: string;
    rootDirectory?: string;
    signal?: AbortSignal;
  } = {},
): Promise<CheckFilesResult> => {
  const { argumentsList, canonicalRoot, targets } =
    await buildAnalyzerArguments(input, rootDirectory);
  const result = await runAnalyzer(argumentsList, canonicalRoot, signal);
  if (result.exitCode !== 0 && result.exitCode !== 1) {
    throw new Error(
      result.stderr.trim() ||
        `Coding Bible analyzer exited with status ${result.exitCode}.`,
    );
  }

  const analyzer = parseAnalyzerReport(result.stdout);

  return {
    schemaVersion: 1,
    kind: "file-check",
    root: ".",
    targets,
    analyzer,
    ruleReferences: createRuleReferences(analyzer.findings, canonicalBaseUrl),
    coverageNote:
      "A clean result covers only implemented deterministic analyzer rules; semantic Coding Bible rules still require review.",
  };
};
