import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { planFixes } from "../src/planFixes.ts";

test("planFixes returns a prioritized read-only remediation plan", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "coding-bible-mcp-plan-"));
  await mkdir(path.join(root, "src"));
  const sourcePath = path.join(root, "src", "unsafe.ts");
  const original = "export const parse = (value: any) => value;\n";
  await writeFile(sourcePath, original);

  const result = await planFixes({ paths: ["src"] }, { rootDirectory: root });

  assert.equal(result.kind, "fix-plan");
  assert.equal(result.fixPack.formatVersion, 1);
  assert.equal(result.fixPack.summary.findings, 1);
  assert.equal(result.fixPack.reviewOrder[0]?.ruleId, "TS-001");
  assert.match(result.reviewBrief, /Coding Bible Review Brief/u);
  assert.match(result.reviewBrief, /TS-001/u);
  assert.equal(await readFile(sourcePath, "utf8"), original);
  await assert.rejects(
    () => access(path.join(root, ".coding-bible")),
    /ENOENT/u,
  );
});
