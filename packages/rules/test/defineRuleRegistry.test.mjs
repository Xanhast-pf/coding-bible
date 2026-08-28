import assert from "node:assert/strict";
import test from "node:test";

import { defineRuleRegistry } from "../src/defineRuleRegistry.ts";

const createRule = (overrides = {}) => ({
  bad: { code: "let value = 1;", language: "typescript" },
  detection: {
    autoFixable: false,
    detectable: false,
  },
  good: { code: "const value = 1;", language: "typescript" },
  id: "CORE-003",
  level: "should",
  pack: "core",
  rationale: "Const communicates that a binding is not reassigned.",
  status: "stable",
  summary: "Default to immutable bindings.",
  tags: ["clarity"],
  title: "Prefer const",
  ...overrides,
});

test("defineRuleRegistry accepts a valid stable rule", () => {
  const rule = createRule();

  assert.deepEqual(defineRuleRegistry([rule]), [rule]);
});

test("defineRuleRegistry rejects stable rules without paired examples", () => {
  const rule = createRule({ good: undefined });

  assert.throws(
    () => defineRuleRegistry([rule]),
    /examples must include both a good and bad case.*stable rules require good and bad examples/s,
  );
});

test("defineRuleRegistry rejects duplicate rule IDs", () => {
  const rule = createRule();

  assert.throws(
    () => defineRuleRegistry([rule, rule]),
    /CORE-003: duplicate rule ID/,
  );
});
