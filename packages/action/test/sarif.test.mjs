import assert from "node:assert/strict";
import test from "node:test";

import { createSarif } from "../src/sarif.mjs";

test("SARIF output uses GitHub-supported 2.1.0 shape and stable rule metadata", () => {
  const rulesById = new Map([
    [
      "TS-001",
      {
        id: "TS-001",
        title: "Avoid any",
        summary: "Keep useful type guarantees.",
        level: "must",
        pack: "typescript",
        status: "stable",
      },
    ],
  ]);
  const sarif = createSarif({
    rulesById,
    diagnostics: [],
    findings: [
      {
        ruleId: "TS-001",
        severity: "error",
        filePath: "src/a.ts",
        excerpt: "const value: any = input;",
        message: "Avoid explicit any.",
        suggestion: "Use a narrower type.",
        location: { line: 1, column: 14, endLine: 1, endColumn: 17 },
      },
    ],
  });

  assert.equal(sarif.version, "2.1.0");
  assert.equal(sarif.runs[0].tool.driver.semanticVersion, "0.25.0");
  assert.equal(sarif.runs[0].tool.driver.rules[0].id, "TS-001");
  assert.equal(sarif.runs[0].results[0].ruleId, "TS-001");
  assert.equal(sarif.runs[0].results[0].level, "error");
  assert.match(
    sarif.runs[0].results[0].partialFingerprints.codingBibleFinding,
    /^[a-f0-9]{24}$/u,
  );
});
