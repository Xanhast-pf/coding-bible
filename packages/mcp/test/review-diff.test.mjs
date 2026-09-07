import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { parseGitDiff, reviewDiff } from "../src/reviewDiff.ts";

const createDiff = (addedLine) => `diff --git a/src/example.ts b/src/example.ts
index 1111111..2222222 100644
--- a/src/example.ts
+++ b/src/example.ts
@@ -1 +1,2 @@
 export const safe = 1;
+${addedLine}
`;

test("parseGitDiff tracks only added/modified current-file lines", () => {
  assert.deepEqual(parseGitDiff(createDiff("export const next = 2;")), [
    {
      file: "src/example.ts",
      ranges: [{ startLine: 2, endLine: 2 }],
    },
  ]);
});

test("parseGitDiff does not treat added content starting with ++ as a file header", () => {
  assert.deepEqual(parseGitDiff(createDiff("++counter;")), [
    {
      file: "src/example.ts",
      ranges: [{ startLine: 2, endLine: 2 }],
    },
  ]);
});

test("reviewDiff reports deterministic findings that touch changed lines", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "coding-bible-mcp-diff-"));
  await mkdir(path.join(root, "src"));
  await writeFile(
    path.join(root, "src", "example.ts"),
    "export const safe = 1;\nexport const parse = (value: any) => value;\n",
  );

  const result = await reviewDiff(
    { diff: createDiff("export const parse = (value: any) => value;") },
    { rootDirectory: root },
  );

  assert.equal(result.kind, "diff-review");
  assert.equal(result.summary.changedLines, 1);
  assert.equal(result.summary.findings, 1);
  assert.equal(result.findings[0]?.ruleId, "TS-001");
  assert.equal(result.findings[0]?.location.line, 2);
  assert.equal(result.ruleReferences[0]?.id, "TS-001");
  assert.match(result.coverageNote, /added or modified/);
});

test("reviewDiff filters violations that exist only on unchanged context lines", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-mcp-diff-context-"),
  );
  await mkdir(path.join(root, "src"));
  await writeFile(
    path.join(root, "src", "example.ts"),
    "export const parse = (value: any) => value;\nexport const next = 2;\n",
  );
  const diff = `diff --git a/src/example.ts b/src/example.ts
--- a/src/example.ts
+++ b/src/example.ts
@@ -1 +1,2 @@
 export const parse = (value: any) => value;
+export const next = 2;
`;

  const result = await reviewDiff({ diff }, { rootDirectory: root });

  assert.equal(result.summary.findings, 0);
});

test("reviewDiff handles deleted-only changes without scanning unrelated files", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-mcp-diff-delete-"),
  );
  const diff = `diff --git a/old.ts b/old.ts
--- a/old.ts
+++ /dev/null
@@ -1 +0,0 @@
-export const old = true;
`;

  const result = await reviewDiff({ diff }, { rootDirectory: root });

  assert.equal(result.summary.filesAnalyzed, 0);
  assert.equal(result.summary.findings, 0);
  assert.ok(result.warnings.length > 0);
});

test("reviewDiff preserves custom-rule metadata instead of requiring a canonical rule", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-mcp-diff-custom-"),
  );
  await mkdir(path.join(root, "src"));
  await writeFile(
    path.join(root, "coding-bible.config.json"),
    JSON.stringify({
      customRules: [
        {
          id: "ACME-001",
          title: "Avoid dangerous",
          rationale: "Custom project policy.",
          message: "Do not call dangerous().",
          suggestion: "Use safeAlternative().",
          confidence: "strong",
          impact: "high",
          url: "https://example.com/rules/ACME-001",
          match: { kind: "call", callee: "dangerous" },
        },
      ],
    }),
  );
  await writeFile(
    path.join(root, "src", "example.ts"),
    "export const safe = 1;\ndangerous();\n",
  );

  const result = await reviewDiff(
    { diff: createDiff("dangerous();") },
    { rootDirectory: root },
  );

  const finding = result.findings.find(({ ruleId }) => ruleId === "ACME-001");
  assert.ok(finding);
  assert.equal(finding.rule.title, "Avoid dangerous");
  assert.equal(finding.rule.source, "finding");
  assert.equal(finding.rule.url, "https://example.com/rules/ACME-001");
});
