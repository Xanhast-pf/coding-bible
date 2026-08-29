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
