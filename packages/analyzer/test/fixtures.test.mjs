import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { analyze } from "../src/index.ts";

const readFixture = (name) =>
  readFile(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

const legacyFixtureRuleIds = [
  "A11Y-001",
  "A11Y-002",
  "A11Y-004",
  "CORE-003",
  "GQL-002",
  "I18N-001",
  "I18N-003",
  "JS-001",
  "JS-002",
  "JS-003",
  "JS-004",
  "JS-006",
  "LEGEND-001",
  "LEGEND-004",
  "REACT-004",
  "REACT-006",
  "REACT-008",
  "REACT-009",
  "REACT-010",
  "REACT-011",
  "REACT-012",
  "REDUX-009",
  "TQ-001",
  "TS-001",
  "TS-003",
  "TS-004",
  "TS-007",
].sort();

test("legacy all-violations fixture preserves its broad regression corpus", async () => {
  const source = await readFixture("all-violations.tsx.fixture");
  const result = analyze({ language: "tsx", source });
  const findingRuleIds = [
    ...new Set(result.findings.map(({ ruleId }) => ruleId)),
  ].sort();

  assert.deepEqual(result.diagnostics, []);
  for (const ruleId of legacyFixtureRuleIds) {
    assert.ok(
      findingRuleIds.includes(ruleId),
      `${ruleId} must remain covered by the legacy fixture`,
    );
  }
});

test("all-clean fixture remains clean across every automated rule", async () => {
  const source = await readFixture("all-clean.tsx.fixture");
  const result = analyze({ language: "tsx", source });

  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.findings, []);
  assert.ok(result.ruleIdsChecked.length >= legacyFixtureRuleIds.length);
  for (const ruleId of legacyFixtureRuleIds) {
    assert.ok(result.ruleIdsChecked.includes(ruleId));
  }
});
