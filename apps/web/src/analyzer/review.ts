import {
  applyAnalyzerTextEdits,
  prepareAnalyzerTextEdits,
  type AnalyzerTextEdit,
  type SourceLocation,
} from "@coding-bible/analyzer";

import type { BrowserAnalyzerFinding } from "./types";

export interface BrowserReviewRange {
  end: number;
  start: number;
}

export interface ReviewScrollMetrics {
  containerHeight: number;
  containerTop: number;
  currentScrollTop: number;
  itemHeight: number;
  itemTop: number;
}

export const calculateCenteredReviewScrollTop = ({
  containerHeight,
  containerTop,
  currentScrollTop,
  itemHeight,
  itemTop,
}: ReviewScrollMetrics) =>
  Math.max(
    0,
    currentScrollTop +
      (itemTop - containerTop) +
      itemHeight / 2 -
      containerHeight / 2,
  );

export interface BrowserReviewComparison {
  originalRanges: readonly BrowserReviewRange[];
  originalSource: string;
  proposedRanges: readonly BrowserReviewRange[];
  proposedSource: string;
}

const getLineStarts = (source: string) => {
  const starts = [0];

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\n") {
      starts.push(index + 1);
    }
  }

  return starts;
};

const locationOffset = (
  source: string,
  lineStarts: readonly number[],
  line: number,
  column: number,
) => {
  const lineStart = lineStarts[Math.max(0, line - 1)] ?? source.length;
  const lineEnd = source.indexOf("\n", lineStart);
  const boundedLineEnd = lineEnd === -1 ? source.length : lineEnd;

  return Math.min(boundedLineEnd, lineStart + Math.max(0, column - 1));
};

export const sourceLocationToReviewRange = (
  source: string,
  location: SourceLocation,
): BrowserReviewRange => {
  const lineStarts = getLineStarts(source);
  const start = locationOffset(
    source,
    lineStarts,
    location.line,
    location.column,
  );
  const end = locationOffset(
    source,
    lineStarts,
    location.endLine,
    location.endColumn,
  );

  return {
    end: Math.max(start, end),
    start,
  };
};

const rangeForEdit = (
  edit: AnalyzerTextEdit,
  fallback: BrowserReviewRange,
): BrowserReviewRange =>
  edit.end > edit.start ? { end: edit.end, start: edit.start } : fallback;

const proposedRangeForEdit = (
  edit: AnalyzerTextEdit,
  delta: number,
): BrowserReviewRange => {
  const start = edit.start + delta;
  const end = start + edit.replacement.length;

  return { end, start };
};

export const createBrowserReviewComparison = (
  fileName: string,
  source: string,
  finding: BrowserAnalyzerFinding,
): BrowserReviewComparison => {
  const edits = finding.fix?.edits;
  const fallback = sourceLocationToReviewRange(source, finding.location);

  if (!edits?.length) {
    return {
      originalRanges: [fallback],
      originalSource: source,
      proposedRanges: [fallback],
      proposedSource: source,
    };
  }

  const prepared = prepareAnalyzerTextEdits(source, edits, fileName);
  const originalRanges = prepared.map((edit) => rangeForEdit(edit, fallback));
  const proposedRanges: BrowserReviewRange[] = [];
  let delta = 0;

  for (const edit of prepared) {
    proposedRanges.push(proposedRangeForEdit(edit, delta));
    delta += edit.replacement.length - (edit.end - edit.start);
  }

  return {
    originalRanges,
    originalSource: source,
    proposedRanges,
    proposedSource: applyAnalyzerTextEdits(source, prepared),
  };
};

export const rangesIntersect = (
  left: BrowserReviewRange,
  right: BrowserReviewRange,
) => left.start < right.end && right.start < left.end;
