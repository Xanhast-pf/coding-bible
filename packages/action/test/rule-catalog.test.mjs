import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { createRuleMap } from "../src/ruleCatalog.mjs";

test("action rule catalog reads the generated canonical rules export", async () => {
  const payload = JSON.parse(
    await readFile(
      new URL("../../../apps/web/public/rules.json", import.meta.url),
      "utf8",
    ),
  );
  const rules = await createRuleMap();

  assert.equal(rules.size, payload.ruleCount);
  assert.equal(rules.get("TS-001")?.title, "Avoid any");
});

test("finding metadata is authoritative for custom rule presentation", async () => {
  const { resolveFindingRule } = await import("../src/ruleCatalog.mjs");
  const resolved = resolveFindingRule(
    {
      ruleId: "ACME-001",
      ruleTitle: "Avoid dangerous",
      ruleRationale: "Custom project policy.",
      ruleUrl: "https://example.com/rules/ACME-001",
      message: "Do not call dangerous().",
    },
    new Map(),
    "https://canonical.example/",
  );

  assert.deepEqual(resolved, {
    id: "ACME-001",
    level: null,
    pack: null,
    source: "finding",
    status: null,
    summary: "Custom project policy.",
    title: "Avoid dangerous",
    url: "https://example.com/rules/ACME-001",
  });
});
