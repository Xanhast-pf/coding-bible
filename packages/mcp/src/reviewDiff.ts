import { codingBibleCanonicalUrl } from "./constants.ts";
import {
  checkFiles,
  type AnalyzerReportDiagnostic,
  type AnalyzerReportFinding,
} from "./checkFiles.ts";
import {
  createRuleReference,
  createRuleReferences,
  type McpRuleReference,
} from "./ruleReference.ts";

export interface ReviewDiffInput {
  diff: string;
  configPath?: string;
  ignoreBaseline?: boolean;
}

export interface DiffLineRange {
  startLine: number;
  endLine: number;
}

export interface DiffFileChange {
  file: string;
  ranges: readonly DiffLineRange[];
}

export interface ReviewDiffFinding extends AnalyzerReportFinding {
  rule: McpRuleReference;
}

export interface ReviewDiffResult {
  schemaVersion: 1;
  kind: "diff-review";
  root: string;
  files: readonly DiffFileChange[];
  summary: {
    changedLines: number;
    diagnostics: number;
    errors: number;
    filesAnalyzed: number;
    filesInDiff: number;
    findings: number;
    warnings: number;
  };
  diagnostics: readonly AnalyzerReportDiagnostic[];
  findings: readonly ReviewDiffFinding[];
  ruleReferences: readonly McpRuleReference[];
  coverageNote: string;
  warnings: readonly string[];
}

const maximumDiffBytes = 2 * 1024 * 1024;
const hunkPattern = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/u;

const normalizePath = (value: string) =>
  value.replaceAll("\\", "/").replace(/^\.\//u, "");

const readDiffPath = (line: string) => {
  const raw = line.slice(4).trimEnd();
  if (raw === "/dev/null") {
    return null;
  }

  if (raw.startsWith('"')) {
    throw new Error(
      "Quoted Git paths are not supported by review_diff. Re-run git with -c core.quotePath=false and pass that diff.",
    );
  }

  return normalizePath(raw.startsWith("b/") ? raw.slice(2) : raw);
};

const toRanges = (lines: readonly number[]): readonly DiffLineRange[] => {
  const ranges: DiffLineRange[] = [];

  for (const line of lines) {
    const previous = ranges.at(-1);
    if (previous && previous.endLine + 1 === line) {
      previous.endLine = line;
    } else {
      ranges.push({ startLine: line, endLine: line });
    }
  }

  return ranges;
};

export const parseGitDiff = (diff: string): readonly DiffFileChange[] => {
  if (Buffer.byteLength(diff, "utf8") > maximumDiffBytes) {
    throw new Error("review_diff accepts at most 2 MiB of unified diff text.");
  }

  const changedLinesByFile = new Map<string, number[]>();
  let currentFile: string | null = null;
  let currentLine = 0;
  let inHunk = false;

  for (const line of diff.split(/\r?\n/u)) {
    if (!inHunk && line.startsWith("+++ ")) {
      currentFile = readDiffPath(line);
      if (currentFile) {
        changedLinesByFile.set(
          currentFile,
          changedLinesByFile.get(currentFile) ?? [],
        );
      }
      inHunk = false;
      continue;
    }

    const hunk = hunkPattern.exec(line);
    if (hunk) {
      currentLine = Number(hunk[1]);
      inHunk = Boolean(currentFile);
      continue;
    }

    if (!inHunk || !currentFile) {
      continue;
    }

    if (line.startsWith("+")) {
      changedLinesByFile.get(currentFile)?.push(currentLine);
      currentLine += 1;
      continue;
    }

    if (line.startsWith("-")) {
      continue;
    }

    if (line.startsWith(" ")) {
      currentLine += 1;
      continue;
    }

    if (!line.startsWith("\\")) {
      inHunk = false;
    }
  }

  return [...changedLinesByFile.entries()]
    .map(([file, lines]) => ({ file, ranges: toRanges(lines) }))
    .sort((left, right) => left.file.localeCompare(right.file));
};

const locationTouchesRanges = (
  location: { line: number; endLine: number },
  ranges: readonly DiffLineRange[],
) =>
  ranges.some(
    ({ startLine, endLine }) =>
      location.line <= endLine && location.endLine >= startLine,
  );

const filterChangedLocations = <
  Item extends { file: string; location: { line: number; endLine: number } },
>(
  items: readonly Item[],
  rangesByFile: ReadonlyMap<string, readonly DiffLineRange[]>,
) =>
  items.filter((item) => {
    const ranges = rangesByFile.get(normalizePath(item.file));
    return ranges ? locationTouchesRanges(item.location, ranges) : false;
  });

export const reviewDiff = async (
  input: ReviewDiffInput,
  {
    canonicalBaseUrl = codingBibleCanonicalUrl,
    rootDirectory = process.cwd(),
    signal,
  }: {
    canonicalBaseUrl?: string;
    rootDirectory?: string;
    signal?: AbortSignal;
  } = {},
): Promise<ReviewDiffResult> => {
  const files = parseGitDiff(input.diff);
  const analyzableFiles = files.filter(({ ranges }) => ranges.length > 0);
  const warnings: string[] = [];

  if (!files.length) {
    warnings.push("The supplied diff did not contain any current-file paths.");
  } else if (!analyzableFiles.length) {
    warnings.push(
      "The supplied diff contains no added or modified lines that can be analyzed in the current working tree.",
    );
  }

  if (!analyzableFiles.length) {
    return {
      schemaVersion: 1,
      kind: "diff-review",
      root: ".",
      files,
      summary: {
        changedLines: 0,
        diagnostics: 0,
        errors: 0,
        filesAnalyzed: 0,
        filesInDiff: files.length,
        findings: 0,
        warnings: 0,
      },
      diagnostics: [],
      findings: [],
      ruleReferences: [],
      coverageNote:
        "review_diff checks only implemented deterministic analyzer rules on added or modified current-file lines; semantic review and deleted-line reasoning remain separate responsibilities.",
      warnings,
    };
  }

  const checked = await checkFiles(
    {
      paths: analyzableFiles.map(({ file }) => file),
      ...(input.configPath ? { configPath: input.configPath } : {}),
      ...(input.ignoreBaseline ? { ignoreBaseline: true } : {}),
    },
    {
      canonicalBaseUrl,
      rootDirectory,
      ...(signal ? { signal } : {}),
    },
  );
  const rangesByFile = new Map(
    analyzableFiles.map(({ file, ranges }) => [normalizePath(file), ranges]),
  );
  const findings = filterChangedLocations(
    checked.analyzer.findings,
    rangesByFile,
  ).map((finding) => ({
    ...finding,
    rule: createRuleReference(finding.ruleId, canonicalBaseUrl),
  }));
  const diagnostics = filterChangedLocations(
    checked.analyzer.diagnostics,
    rangesByFile,
  );
  const errors = findings.filter(({ severity }) => severity === "error").length;
  const warningFindings = findings.length - errors;
  const changedLines = analyzableFiles.reduce(
    (total, { ranges }) =>
      total +
      ranges.reduce(
        (fileTotal, { startLine, endLine }) =>
          fileTotal + (endLine - startLine + 1),
        0,
      ),
    0,
  );

  return {
    schemaVersion: 1,
    kind: "diff-review",
    root: ".",
    files,
    summary: {
      changedLines,
      diagnostics: diagnostics.length,
      errors,
      filesAnalyzed: checked.analyzer.summary.filesAnalyzed,
      filesInDiff: files.length,
      findings: findings.length,
      warnings: warningFindings,
    },
    diagnostics,
    findings,
    ruleReferences: createRuleReferences(
      findings.map(({ ruleId }) => ruleId),
      canonicalBaseUrl,
    ),
    coverageNote:
      "review_diff checks only implemented deterministic analyzer rules on added or modified current-file lines; semantic review and deleted-line reasoning remain separate responsibilities.",
    warnings,
  };
};
