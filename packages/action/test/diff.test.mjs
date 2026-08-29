import assert from "node:assert/strict";
import test from "node:test";

import { filterChangedLocations, parseGitDiff } from "../src/diff.mjs";

test("Git diff parsing keeps only added and modified current-file lines", () => {
  const diff = `diff --git a/src/example.ts b/src/example.ts
--- a/src/example.ts
+++ b/src/example.ts
@@ -1,2 +1,3 @@
 const a = 1;
-old();
+newCall();
+++startsWithPlus();
`;

  assert.deepEqual(parseGitDiff(diff), [
    {
      file: "src/example.ts",
      ranges: [{ startLine: 2, endLine: 3 }],
    },
  ]);
});

test("changed-location filtering ignores findings on untouched lines", () => {
  const items = [
    { filePath: "src/a.ts", location: { line: 4, endLine: 4 } },
    { filePath: "src/a.ts", location: { line: 8, endLine: 9 } },
  ];
  const changes = [
    { file: "src/a.ts", ranges: [{ startLine: 8, endLine: 8 }] },
  ];

  assert.deepEqual(filterChangedLocations(items, changes), [items[1]]);
});
