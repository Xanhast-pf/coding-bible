import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCenteredReviewScrollTop,
  createBrowserReviewComparison,
  rangesIntersect,
  sourceLocationToReviewRange,
} from "../src/analyzer/review.ts";

const source = `import { User } from "./types";\nconst page = parseInt(rawPage);\n`;

const finding = {
  detectorId: "explicit-radix",
  excerpt: "const page = parseInt(rawPage);",
  fix: {
    description: "Choose and provide the intended radix.",
    edits: [
      {
        end: source.indexOf("parseInt(rawPage)") + "parseInt(rawPage)".length,
        replacement: "parseInt(rawPage, 10)",
        start: source.indexOf("parseInt(rawPage)"),
      },
    ],
    safety: "review",
    title: "Add an explicit radix",
  },
  location: { column: 14, endColumn: 31, endLine: 2, line: 2 },
  message: "parseInt should specify a radix.",
  ruleId: "JS-002",
  severity: "warning",
  suggestion: "Pass the intended radix explicitly.",
};

test("review comparison isolates one finding and highlights replacement ranges", () => {
  const comparison = createBrowserReviewComparison(
    "src/example.ts",
    source,
    finding,
  );

  assert.equal(comparison.originalSource, source);
  assert.match(comparison.proposedSource, /parseInt\(rawPage, 10\)/u);
  assert.equal(comparison.originalRanges.length, 1);
  assert.equal(comparison.proposedRanges.length, 1);
  assert.equal(
    comparison.originalSource.slice(
      comparison.originalRanges[0].start,
      comparison.originalRanges[0].end,
    ),
    "parseInt(rawPage)",
  );
  assert.equal(
    comparison.proposedSource.slice(
      comparison.proposedRanges[0].start,
      comparison.proposedRanges[0].end,
    ),
    "parseInt(rawPage, 10)",
  );
});

test("zero-width insertion still highlights the finding on the original side", () => {
  const offset = source.indexOf("User");
  const comparison = createBrowserReviewComparison("src/example.ts", source, {
    ...finding,
    fix: {
      description: "Mark User as type-only.",
      edits: [{ end: offset, replacement: "type ", start: offset }],
      safety: "safe",
      title: "Mark import as type-only",
    },
    location: { column: 10, endColumn: 14, endLine: 1, line: 1 },
    ruleId: "TS-003",
  });

  assert.equal(
    comparison.originalSource.slice(
      comparison.originalRanges[0].start,
      comparison.originalRanges[0].end,
    ),
    "User",
  );
  assert.equal(
    comparison.proposedSource.slice(
      comparison.proposedRanges[0].start,
      comparison.proposedRanges[0].end,
    ),
    "type ",
  );
});

test("source locations map to absolute source offsets", () => {
  const range = sourceLocationToReviewRange(source, {
    column: 14,
    endColumn: 31,
    endLine: 2,
    line: 2,
  });

  assert.equal(source.slice(range.start, range.end), "parseInt(rawPage)");
  assert.equal(
    rangesIntersect(range, { end: range.end + 5, start: range.end - 1 }),
    true,
  );
  assert.equal(rangesIntersect(range, { end: 3, start: 0 }), false);
});

test("review scrolling centers the active line relative to the code viewport", () => {
  assert.equal(
    calculateCenteredReviewScrollTop({
      containerHeight: 400,
      containerTop: 200,
      currentScrollTop: 600,
      itemHeight: 20,
      itemTop: 350,
    }),
    560,
  );

  assert.equal(
    calculateCenteredReviewScrollTop({
      containerHeight: 400,
      containerTop: 200,
      currentScrollTop: 0,
      itemHeight: 20,
      itemTop: 210,
    }),
    0,
  );
});
