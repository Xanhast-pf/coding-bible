import assert from "node:assert/strict";
import test from "node:test";

import {
  countBrowserFixes,
  createBrowserAnalyzerReport,
  createBrowserFindingFix,
  createBrowserFixPatch,
} from "../src/analyzer/artifacts.ts";

const source = `import { User } from "./types";
const page = parseInt(rawPage);
const value: User = {} as User;
`;

const safeOffset = source.indexOf("User");
const reviewStart = source.indexOf("parseInt(rawPage)");
const reviewEnd = reviewStart + "parseInt(rawPage)".length;

const result = {
  configFileName: "coding-bible.config.json",
  configurationDiagnostics: [],
  durationMs: 12,
  files: [
    {
      fileName: "src/example.ts",
      language: "ts",
      result: {
        checksRun: 2,
        diagnostics: [],
        findings: [
          {
            detectorId: "type-only-imports",
            excerpt: 'import { User } from "./types";',
            fix: {
              description: "Mark User as type-only.",
              edits: [
                { end: safeOffset, replacement: "type ", start: safeOffset },
              ],
              safety: "safe",
              title: "Mark import as type-only",
            },
            location: { column: 10, endColumn: 14, endLine: 1, line: 1 },
            message: "User is used only as a type.",
            ruleId: "TS-003",
            severity: "error",
            suggestion: "Use a type-only import.",
          },
          {
            detectorId: "explicit-radix",
            excerpt: "const page = parseInt(rawPage);",
            fix: {
              description: "Choose and provide the intended radix.",
              edits: [
                {
                  end: reviewEnd,
                  replacement: "parseInt(rawPage, 10)",
                  start: reviewStart,
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
          },
        ],
        ruleIdsChecked: ["JS-002", "TS-003"],
      },
    },
  ],
  mode: "project",
  sourceFileCount: 1,
  tsconfigFileNames: ["tsconfig.json"],
};

const files = [{ fileName: "src/example.ts", source }];

test("browser artifacts separate safe and review patches", () => {
  assert.equal(countBrowserFixes(result, "safe"), 1);
  assert.equal(countBrowserFixes(result, "review"), 1);

  const safePatch = createBrowserFixPatch(result, files, "safe");
  assert.equal(safePatch.files, 1);
  assert.equal(safePatch.fixes, 1);
  assert.match(
    safePatch.patch,
    /diff --git a\/src\/example\.ts b\/src\/example\.ts/u,
  );
  assert.match(safePatch.patch, /-import \{ User \} from "\.\/types";/u);
  assert.match(safePatch.patch, /\+import \{ type User \} from "\.\/types";/u);
  assert.doesNotMatch(safePatch.patch, /parseInt\(rawPage, 10\)/u);

  const reviewPatch = createBrowserFixPatch(result, files, "review");
  assert.equal(reviewPatch.files, 1);
  assert.equal(reviewPatch.fixes, 1);
  assert.match(reviewPatch.patch, /-const page = parseInt\(rawPage\);/u);
  assert.match(reviewPatch.patch, /\+const page = parseInt\(rawPage, 10\);/u);
  assert.doesNotMatch(reviewPatch.patch, /type User/u);
});

test("browser finding fixes preview and apply only that finding's edits", () => {
  const safeFinding = result.files[0].result.findings[0];
  const reviewFinding = result.files[0].result.findings[1];

  const safeFix = createBrowserFindingFix(
    "src/example.ts",
    source,
    safeFinding,
  );
  assert.match(safeFix.patch, /\+import \{ type User \}/u);
  assert.doesNotMatch(safeFix.patch, /parseInt\(rawPage, 10\)/u);
  assert.match(safeFix.source, /import \{ type User \}/u);
  assert.match(safeFix.source, /parseInt\(rawPage\);/u);

  const reviewFix = createBrowserFindingFix(
    "src/example.ts",
    source,
    reviewFinding,
  );
  assert.match(reviewFix.patch, /\+const page = parseInt\(rawPage, 10\);/u);
  assert.doesNotMatch(reviewFix.patch, /type User/u);
  assert.match(reviewFix.source, /parseInt\(rawPage, 10\);/u);
  assert.match(reviewFix.source, /import \{ User \}/u);
});

test("browser report exposes severity and fix safety without source contents", () => {
  const report = createBrowserAnalyzerReport(result, {
    projectName: "example-project",
  });

  assert.equal(report.schemaVersion, 1);
  assert.equal(report.runtime, "browser");
  assert.equal(report.summary.errors, 1);
  assert.equal(report.summary.warnings, 1);
  assert.equal(report.summary.safeFixes, 1);
  assert.equal(report.summary.reviewFixes, 1);
  assert.equal(report.project.name, "example-project");
  assert.equal(report.findings[0].fix.patch, "safe-fixes.patch");
  assert.equal(report.findings[1].fix.patch, "review-fixes.patch");
  assert.equal(report.findings[1].severity, "warning");
  assert.equal(JSON.stringify(report).includes(source), false);
});
