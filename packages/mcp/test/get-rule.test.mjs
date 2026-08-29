import assert from "node:assert/strict";
import test from "node:test";

import { getRule } from "../src/getRule.ts";

test("getRule resolves stable IDs case-insensitively", () => {
  const result = getRule(" ts-001 ", {
    canonicalBaseUrl: "https://example.com/bible/",
  });

  assert.ok(result);
  assert.equal(result.rule.id, "TS-001");
  assert.equal(result.canonicalUrl, "https://example.com/bible/#TS-001");
  assert.match(result.prompt, /TS-001/);
  assert.match(result.prompt, /TS-001 — Avoid any/);
});

test("getRule returns null for an unknown ID", () => {
  assert.equal(getRule("TS-999"), null);
});
