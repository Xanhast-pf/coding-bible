import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { ruleIdToIdentifier, rulePackLayouts } from "../rules/layout.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const rulesRoot = path.join(root, "packages/rules/src/rules");
const detectorsRoot = path.join(root, "packages/analyzer/src/detectors");

const prefixedFiles = (directory, prefix) =>
  fs
    .readdirSync(directory)
    .filter((name) => name !== "index.ts" && !name.startsWith("_"))
    .sort()
    .map((name) => {
      assert.match(
        name,
        new RegExp(`^${prefix}-\\d{3}-[a-z0-9-]+\\.ts$`),
        `${name} must start with its permanent rule ID`,
      );
      return name;
    });

test("Bible rules use one prefixed source file per rule", () => {
  assert.deepEqual(
    fs.readdirSync(rulesRoot).filter((name) => name.endsWith(".ts")),
    ["index.ts"],
  );

  for (const layout of rulePackLayouts) {
    const directory = path.join(rulesRoot, layout.directory);
    for (const file of prefixedFiles(directory, layout.prefix)) {
      const ruleId = file.match(/^([A-Z0-9]+-\d{3})-/)?.[1];
      assert.ok(ruleId);
      const source = fs.readFileSync(path.join(directory, file), "utf8");
      assert.match(source, new RegExp(`id: "${ruleId}"`));
      assert.match(
        source,
        new RegExp(`export const ${ruleIdToIdentifier(ruleId)}Rule\\b`),
      );
    }
  }
});

test("automated rule modules mirror the prefixed rule-file convention", () => {
  assert.deepEqual(
    fs.readdirSync(detectorsRoot).filter((name) => name.endsWith(".ts")),
    ["index.ts", "registry.generated.ts"],
  );

  for (const layout of rulePackLayouts) {
    const directory = path.join(detectorsRoot, layout.directory);
    if (!fs.existsSync(directory)) continue;

    for (const file of prefixedFiles(directory, layout.prefix)) {
      const ruleId = file.match(/^([A-Z0-9]+-\d{3})-/)?.[1];
      assert.ok(ruleId);
      const source = fs.readFileSync(path.join(directory, file), "utf8");
      assert.match(source, new RegExp(`ruleId: "${ruleId}"`));
      assert.match(
        source,
        new RegExp(`export const ${ruleIdToIdentifier(ruleId)}Detectors\\b`),
      );
    }
  }
});
