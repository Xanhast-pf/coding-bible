import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

test("repository root does not contain scratch artifacts", () => {
  const scratchArtifacts = fs
    .readdirSync(root)
    .filter((name) => name.startsWith(".tmp-"))
    .sort();

  assert.deepEqual(
    scratchArtifacts,
    [],
    `Remove scratch artifacts before committing: ${scratchArtifacts.join(", ")}`,
  );

  const ignoredPatterns = fs
    .readFileSync(path.join(root, ".gitignore"), "utf8")
    .split(/\r?\n/u);
  assert.ok(ignoredPatterns.includes(".tmp-*"));
});

test("analyzer README coverage matches the automation policy", () => {
  const policy = JSON.parse(
    fs.readFileSync(
      path.join(root, "docs/analyzer-automation-policy.json"),
      "utf8",
    ),
  );
  const automatedRules = policy.rules.filter(
    (rule) => rule.status === "automated",
  ).length;
  const totalRules = policy.rules.length;
  const readme = fs.readFileSync(
    path.join(root, "packages/analyzer/README.md"),
    "utf8",
  );

  assert.match(
    readme,
    new RegExp(
      `current automation policy covers \\*\\*${automatedRules} of the ${totalRules} Bible rules\\*\\*`,
      "u",
    ),
  );
});
