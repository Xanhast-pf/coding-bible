import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { analyze, detectors } from "../src/index.ts";

const readFixture = (name) =>
  readFile(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

const automatedRuleIds = [...new Set(detectors.map(({ ruleId }) => ruleId))].sort();

test("all-violations fixture exercises every automated rule", async () => {
  const source = await readFixture("all-violations.tsx.fixture");
  const result = analyze({ language: "tsx", source });
  const findingRuleIds = [...new Set(result.findings.map(({ ruleId }) => ruleId))].sort();

  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(findingRuleIds, automatedRuleIds);
});

test("all-clean fixture remains clean across every automated rule", async () => {
  const source = await readFixture("all-clean.tsx.fixture");
  const result = analyze({ language: "tsx", source });

  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.findings, []);
  assert.deepEqual(result.ruleIdsChecked, automatedRuleIds);
});
