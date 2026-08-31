import {
  applyAnalyzerTextEdits,
  createAnalyzerFilePatch,
  normalizeAnalyzerPatchPath,
  prepareAnalyzerTextEdits,
  type AnalyzerFixSafety,
  type AnalyzerTextEdit,
} from "@coding-bible/analyzer";

import type {
  BrowserAnalyzeResult,
  BrowserAnalyzerFinding,
  BrowserProjectFile,
} from "./types";

const ruleBaseUrl = "https://xanhast-pf.github.io/coding-bible/#";

interface BrowserArtifactOptions {
  projectName?: string;
}

interface FixEntry {
  edits: AnalyzerTextEdit[];
  findingCount: number;
}

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

export const createBrowserAnalyzerReport = (
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

  return {
    schemaVersion: 1,
    runtime: "browser",
    mode: result.mode,
    ruleSelection: result.ruleSelection,
    summary: {
      diagnostics: diagnostics.length,
      errors,
      filesAnalyzed: result.sourceFileCount,
      findings: findings.length,
      reviewFixes,
      rulesChecked: ruleIdsChecked.length,
      safeFixes,
      warnings,
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
    findings: findings.map(({ fileName, finding }) => ({
      detectorId: finding.detectorId,
      excerpt: finding.excerpt,
      file: normalizeAnalyzerPatchPath(fileName),
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
            safety: "none",
          },
      location: finding.location,
      message: finding.message,
      ruleId: finding.ruleId,
      ruleUrl: `${ruleBaseUrl}${finding.ruleId}`,
      severity: finding.severity,
      suggestion: finding.suggestion,
    })),
  };
};
