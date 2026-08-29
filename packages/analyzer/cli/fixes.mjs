import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { analyze } from "../src/index.ts";
import { languageByExtension } from "./project.mjs";
import { createAnalyzerReport } from "./report.mjs";

const defaultOutputDirectory = ".coding-bible";
const contextLines = 3;

const normalizePatchPath = (filePath) => filePath.replaceAll("\\", "/");

const applyEdits = (source, edits) => {
  let output = source;

  for (const edit of [...edits].sort(
    (left, right) => right.start - left.start,
  )) {
    output = `${output.slice(0, edit.start)}${edit.replacement}${output.slice(edit.end)}`;
  }

  return output;
};

const getLineStarts = (source) => {
  const starts = [0];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\n") {
      starts.push(index + 1);
    }
  }
  return starts;
};

const lineIndexAt = (starts, offset) => {
  let low = 0;
  let high = starts.length - 1;
  let result = 0;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (starts[middle] <= offset) {
      result = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return result;
};

const splitPatchLines = (value) => {
  const normalized = value.replaceAll("\r\n", "\n");
  const hasFinalNewline = normalized.endsWith("\n");
  const lines = normalized.split("\n");
  if (hasFinalNewline) {
    lines.pop();
  }
  return { hasFinalNewline, lines };
};

const diffLines = (oldLines, newLines) => {
  const rows = oldLines.length + 1;
  const columns = newLines.length + 1;
  const table = Array.from({ length: rows }, () => new Uint16Array(columns));

  for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
      table[oldIndex][newIndex] =
        oldLines[oldIndex] === newLines[newIndex]
          ? table[oldIndex + 1][newIndex + 1] + 1
          : Math.max(
              table[oldIndex + 1][newIndex],
              table[oldIndex][newIndex + 1],
            );
    }
  }

  const operations = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (
      oldIndex < oldLines.length &&
      newIndex < newLines.length &&
      oldLines[oldIndex] === newLines[newIndex]
    ) {
      operations.push({
        kind: "context",
        line: oldLines[oldIndex],
        oldIndex,
        newIndex,
      });
      oldIndex += 1;
      newIndex += 1;
      continue;
    }

    if (
      newIndex < newLines.length &&
      (oldIndex === oldLines.length ||
        table[oldIndex][newIndex + 1] > table[oldIndex + 1][newIndex])
    ) {
      operations.push({ kind: "add", line: newLines[newIndex], newIndex });
      newIndex += 1;
      continue;
    }

    operations.push({ kind: "remove", line: oldLines[oldIndex], oldIndex });
    oldIndex += 1;
  }

  return operations;
};

const groupEdits = (source, edits) => {
  const lineStarts = getLineStarts(source);
  const groups = [];

  for (const edit of edits) {
    const startLine = lineIndexAt(lineStarts, edit.start);
    const endOffset = edit.end > edit.start ? edit.end - 1 : edit.start;
    const endLine = lineIndexAt(lineStarts, Math.min(endOffset, source.length));
    const previous = groups.at(-1);

    if (previous && startLine <= previous.endLine + contextLines * 2 + 1) {
      previous.edits.push(edit);
      previous.endLine = Math.max(previous.endLine, endLine);
      continue;
    }

    groups.push({ edits: [edit], endLine, startLine });
  }

  return { groups, lineStarts };
};

const createHunks = (source, edits) => {
  const { groups, lineStarts } = groupEdits(source, edits);
  const sourceLines = splitPatchLines(source);
  const hunks = [];
  let lineDelta = 0;

  for (const group of groups) {
    const oldStartLine = Math.max(0, group.startLine - contextLines);
    const oldEndLine = Math.min(
      sourceLines.lines.length,
      group.endLine + contextLines + 1,
    );
    const sliceStart = lineStarts[oldStartLine] ?? 0;
    const sliceEnd = lineStarts[oldEndLine] ?? source.length;
    const oldSlice = source.slice(sliceStart, sliceEnd);
    const relativeEdits = group.edits.map((edit) => ({
      ...edit,
      end: edit.end - sliceStart,
      start: edit.start - sliceStart,
    }));
    const newSlice = applyEdits(oldSlice, relativeEdits);
    const oldSegment = splitPatchLines(oldSlice);
    const newSegment = splitPatchLines(newSlice);
    const operations = diffLines(oldSegment.lines, newSegment.lines);
    const lines = [];

    for (const operation of operations) {
      const prefix =
        operation.kind === "add"
          ? "+"
          : operation.kind === "remove"
            ? "-"
            : " ";
      lines.push(`${prefix}${operation.line}`);

      const oldIsFinal =
        operation.oldIndex === oldSegment.lines.length - 1 &&
        oldEndLine === sourceLines.lines.length &&
        !sourceLines.hasFinalNewline;
      const newIsFinal =
        operation.newIndex === newSegment.lines.length - 1 &&
        oldEndLine === sourceLines.lines.length &&
        !newSegment.hasFinalNewline;
      if (
        (operation.kind !== "add" && oldIsFinal) ||
        (operation.kind !== "remove" && newIsFinal)
      ) {
        lines.push("\\ No newline at end of file");
      }
    }

    hunks.push(
      `@@ -${oldStartLine + 1},${oldSegment.lines.length} +${oldStartLine + 1 + lineDelta},${newSegment.lines.length} @@\n${lines.join("\n")}`,
    );
    lineDelta += newSegment.lines.length - oldSegment.lines.length;
  }

  return hunks;
};

const assertValidEdit = (edit, source, filePath) => {
  if (
    !Number.isInteger(edit.start) ||
    !Number.isInteger(edit.end) ||
    edit.start < 0 ||
    edit.end < edit.start ||
    edit.end > source.length
  ) {
    throw new Error(`Invalid analyzer fix range for ${filePath}.`);
  }
};

const collectFileFixes = async (result, safety) => {
  const byFile = new Map();

  for (const finding of result.findings) {
    if (finding.fix?.safety !== safety || !finding.fix.edits?.length) {
      continue;
    }

    const entry = byFile.get(finding.filePath) ?? { findings: [], edits: [] };
    entry.findings.push(finding);
    entry.edits.push(...finding.fix.edits);
    byFile.set(finding.filePath, entry);
  }

  const plans = [];
  for (const [filePath, entry] of [...byFile.entries()].sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    const absolutePath = path.resolve(result.rootDir, filePath);
    const source = await readFile(absolutePath, "utf8");
    const deduped = new Map();

    for (const edit of entry.edits) {
      assertValidEdit(edit, source, filePath);
      deduped.set(`${edit.start}:${edit.end}:${edit.replacement}`, edit);
    }

    const edits = [...deduped.values()].sort(
      (left, right) => left.start - right.start || left.end - right.end,
    );
    for (let index = 1; index < edits.length; index += 1) {
      const previous = edits[index - 1];
      const current = edits[index];
      if (
        current.start < previous.end ||
        (current.start === previous.start && current.end === previous.end)
      ) {
        throw new Error(
          `Conflicting ${safety} analyzer fixes overlap in ${filePath}.`,
        );
      }
    }

    plans.push({
      absolutePath,
      edits,
      filePath,
      findings: entry.findings,
      source,
    });
  }

  return plans;
};

const verifySafePlans = (plans) => {
  for (const plan of plans) {
    const language = languageByExtension.get(path.extname(plan.absolutePath));
    if (!language) {
      continue;
    }

    for (const finding of plan.findings) {
      if (!finding.fix?.edits?.length) {
        continue;
      }

      const fixedSource = applyEdits(plan.source, finding.fix.edits);
      const verification = analyze({
        fileName: plan.absolutePath,
        language,
        source: fixedSource,
      });
      const stillPresent = verification.findings.some(
        (candidate) =>
          candidate.detectorId === finding.detectorId &&
          candidate.ruleId === finding.ruleId &&
          candidate.location.line === finding.location.line,
      );

      if (stillPresent) {
        throw new Error(
          `Safe fix verification failed for ${finding.ruleId} in ${plan.filePath}:${finding.location.line}.`,
        );
      }
    }
  }
};

export const createFixPatch = async (result, safety) => {
  const plans = await collectFileFixes(result, safety);
  if (safety === "safe") {
    verifySafePlans(plans);
  }

  const filePatches = plans.map((plan) => {
    const patchPath = normalizePatchPath(plan.filePath);
    const hunks = createHunks(plan.source, plan.edits);
    return [
      `diff --git a/${patchPath} b/${patchPath}`,
      `--- a/${patchPath}`,
      `+++ b/${patchPath}`,
      ...hunks,
    ].join("\n");
  });

  return {
    files: plans.length,
    fixes: plans.reduce((count, plan) => count + plan.findings.length, 0),
    patch: filePatches.length ? `${filePatches.join("\n")}\n` : "",
  };
};

export const writeAnalysisArtifacts = async (
  result,
  {
    includeReviewFixes = false,
    outputDirectory = defaultOutputDirectory,
    patch = false,
    report = false,
  } = {},
) => {
  if (!report && !patch) {
    return { files: [], report: createAnalyzerReport(result) };
  }

  const absoluteDirectory = path.resolve(result.rootDir, outputDirectory);
  await mkdir(absoluteDirectory, { recursive: true });
  const displayDirectory = normalizePatchPath(
    path.relative(result.rootDir, absoluteDirectory) ||
      path.basename(absoluteDirectory),
  );
  const written = [];
  let safePatch = null;
  let reviewPatch = null;
  let safePatchPath = null;
  let reviewPatchPath = null;

  if (patch) {
    safePatch = await createFixPatch(result, "safe");
    if (safePatch.fixes) {
      const filePath = path.join(absoluteDirectory, "safe-fixes.patch");
      await writeFile(filePath, safePatch.patch, "utf8");
      safePatchPath = `${displayDirectory}/safe-fixes.patch`;
      written.push(path.relative(result.rootDir, filePath));
    }
  }

  if (includeReviewFixes) {
    reviewPatch = await createFixPatch(result, "review");
    if (reviewPatch.fixes) {
      const filePath = path.join(absoluteDirectory, "review-fixes.patch");
      await writeFile(filePath, reviewPatch.patch, "utf8");
      reviewPatchPath = `${displayDirectory}/review-fixes.patch`;
      written.push(path.relative(result.rootDir, filePath));
    }
  }

  const analyzerReport = createAnalyzerReport(result, {
    patchFiles: {
      review: reviewPatchPath,
      safe: safePatchPath,
    },
  });
  if (report) {
    const filePath = path.join(absoluteDirectory, "report.json");
    await writeFile(
      filePath,
      `${JSON.stringify(analyzerReport, null, 2)}\n`,
      "utf8",
    );
    written.unshift(path.relative(result.rootDir, filePath));
  }

  return {
    files: written,
    report: analyzerReport,
    reviewPatch,
    safePatch,
  };
};
