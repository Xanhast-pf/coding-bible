import {
  analyzerRuleIds,
  applyAnalyzerTextEdits,
  createAnalyzerFilePatch,
  createAnalyzerFindingFingerprintPayload,
  normalizeAnalyzerPatchPath,
  prepareAnalyzerTextEdits,
  type AnalyzerFixSafety,
  type AnalyzerReportV1,
  type AnalyzerTextEdit,
} from "@coding-bible/analyzer";

import type {
  BrowserAnalyzeResult,
  BrowserAnalyzerFinding,
  BrowserProjectFile,
} from "./types";

const ruleBaseUrl = "https://xanhast-pf.github.io/coding-bible/#";
const builtInRuleIds = new Set(analyzerRuleIds);

interface BrowserArtifactOptions {
  projectName?: string;
}

interface FixEntry {
  edits: AnalyzerTextEdit[];
  findingCount: number;
}

const createBrowserFindingFingerprint = async (
  file: string,
  finding: BrowserAnalyzerFinding,
) => {
  const payload = createAnalyzerFindingFingerprintPayload({
    detectorId: finding.detectorId,
    excerpt: finding.excerpt,
    file,
    message: finding.message,
    ruleId: finding.ruleId,
  });
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(payload),
  );
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
};

const hasEdits = (finding: BrowserAnalyzerFinding) =>
  Boolean(finding.fix?.edits?.length);

export const createBrowserFindingFix = (
  fileName: string,
  source: string,
  finding: BrowserAnalyzerFinding,
) => {
  const edits = finding.fix?.edits;
  if (!edits?.length) {
    return { patch: "", source };
  }

  const prepared = prepareAnalyzerTextEdits(source, edits, fileName);
  const patch = createAnalyzerFilePatch(fileName, source, prepared);

  return {
    patch: patch ? `${patch}\n` : "",
    source: applyAnalyzerTextEdits(source, prepared),
  };
};

export const countBrowserFixes = (
  result: BrowserAnalyzeResult,
  safety: AnalyzerFixSafety,
) =>
  result.files.reduce(
    (total, { result: fileResult }) =>
      total +
      fileResult.findings.filter(
        (finding) => finding.fix?.safety === safety && hasEdits(finding),
      ).length,
    0,
  );

export const createBrowserFixPatch = (
  result: BrowserAnalyzeResult,
  files: readonly BrowserProjectFile[],
  safety: AnalyzerFixSafety,
) => {
  const sources = new Map(
    files.map(({ fileName, source }) => [
      normalizeAnalyzerPatchPath(fileName),
      source,
    ]),
  );
  const fixesByFile = new Map<string, FixEntry>();

  for (const { fileName, result: fileResult } of result.files) {
    for (const finding of fileResult.findings) {
      if (finding.fix?.safety !== safety || !finding.fix.edits?.length) {
        continue;
      }

      const normalizedFileName = normalizeAnalyzerPatchPath(fileName);
      const entry = fixesByFile.get(normalizedFileName) ?? {
        edits: [],
        findingCount: 0,
      };
      entry.edits.push(...finding.fix.edits);
      entry.findingCount += 1;
      fixesByFile.set(normalizedFileName, entry);
    }
  }

  const patches: string[] = [];
  let fixCount = 0;

  for (const [fileName, entry] of [...fixesByFile.entries()].sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    const source = sources.get(fileName);
    if (source === undefined) {
      throw new Error(`Could not find source text for ${fileName}.`);
    }

    const patch = createAnalyzerFilePatch(fileName, source, entry.edits);
    if (patch) {
      patches.push(patch);
      fixCount += entry.findingCount;
    }
  }

  return {
    files: patches.length,
    fixes: fixCount,
    patch: patches.length ? `${patches.join("\n")}\n` : "",
  };
};

export const createBrowserAnalyzerReport = async (
  result: BrowserAnalyzeResult,
  options: BrowserArtifactOptions = {},
) => {
  const findings = result.files.flatMap(({ fileName, result: fileResult }) =>
    fileResult.findings.map((finding) => ({ fileName, finding })),
  );
  const diagnostics = result.files.flatMap(({ fileName, result: fileResult }) =>
    fileResult.diagnostics.map((diagnostic) => ({ diagnostic, fileName })),
  );
  const ruleIdsChecked = [
    ...new Set(
      result.files.flatMap(
        ({ result: fileResult }) => fileResult.ruleIdsChecked,
      ),
    ),
  ].sort();
  const errors = findings.filter(
    ({ finding }) => finding.severity === "error",
  ).length;
  const warnings = findings.length - errors;
  const safeFixes = countBrowserFixes(result, "safe");
  const reviewFixes = countBrowserFixes(result, "review");
  const serializedFindings = await Promise.all(
    findings.map(async ({ fileName, finding }) => {
      const file = normalizeAnalyzerPatchPath(fileName);
      return {
        confidence: finding.confidence,
        contextNote: finding.contextNote ?? null,
        detectorId: finding.detectorId,
        excerpt: finding.excerpt,
        file,
        fingerprint: await createBrowserFindingFingerprint(file, finding),
        fix: finding.fix
          ? {
              available: Boolean(finding.fix.edits?.length),
              description: finding.fix.description,
              patch: finding.fix.edits?.length
                ? finding.fix.safety === "safe"
                  ? "safe-fixes.patch"
                  : "review-fixes.patch"
                : null,
              safety: finding.fix.safety,
              title: finding.fix.title,
            }
          : {
              available: false,
              safety: "none" as const,
            },
        impact: finding.impact,
        location: finding.location,
        message: finding.message,
        ruleId: finding.ruleId,
        ruleRationale: finding.ruleRationale ?? null,
        ruleTitle: finding.ruleTitle ?? null,
        ruleUrl:
          finding.ruleUrl ??
          (builtInRuleIds.has(finding.ruleId)
            ? `${ruleBaseUrl}${finding.ruleId}`
            : null),
        severity: finding.severity,
        suggestion: finding.suggestion,
      };
    }),
  );

  return {
    schemaVersion: 1,
    runtime: "browser",
    analyzer: result.analyzer,
    mode: result.mode,
    ruleSelection: result.ruleSelection,
    summary: {
      baselineSuppressed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      diagnostics: diagnostics.length,
      errors,
      filesDiscovered: result.sourceFileCount,
      filesAnalyzed: result.sourceFileCount,
      findings: findings.length,
      reviewFixes,
      rulesChecked: ruleIdsChecked.length,
      safeFixes,
      warnings,
      confidence: {
        certain: findings.filter(
          ({ finding }) => finding.confidence === "certain",
        ).length,
        strong: findings.filter(
          ({ finding }) => finding.confidence === "strong",
        ).length,
        contextual: findings.filter(
          ({ finding }) => finding.confidence === "contextual",
        ).length,
      },
      impact: {
        high: findings.filter(({ finding }) => finding.impact === "high")
          .length,
        medium: findings.filter(({ finding }) => finding.impact === "medium")
          .length,
        low: findings.filter(({ finding }) => finding.impact === "low").length,
      },
    },
    project: {
      configPath: result.configFileName,
      name: options.projectName ?? null,
      tsconfigPaths: result.tsconfigFileNames,
    },
    configurationDiagnostics: result.configurationDiagnostics,
    diagnostics: diagnostics.map(({ diagnostic, fileName }) => ({
      excerpt: diagnostic.excerpt,
      file: normalizeAnalyzerPatchPath(fileName),
      location: diagnostic.location,
      message: diagnostic.message,
    })),
    findings: serializedFindings,
  } satisfies AnalyzerReportV1;
};
