import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const actionPackage = JSON.parse(read("packages/action/package.json"));
const releaseVersion = actionPackage.version;
const releaseTag = `v${releaseVersion}`;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

test("Action runtime version matches the package release version", () => {
  assert.match(releaseVersion, /^\d+\.\d+\.\d+$/u);

  const constants = read("packages/action/src/constants.mjs");
  assert.match(
    constants,
    new RegExp(
      `export const actionVersion = "${escapeRegExp(releaseVersion)}";`,
      "u",
    ),
  );
});

test("SARIF contract expects the same Action release version", () => {
  const sarifTest = read("packages/action/test/sarif.test.mjs");
  assert.match(
    sarifTest,
    new RegExp(`semanticVersion, "${escapeRegExp(releaseVersion)}"\\);`, "u"),
  );
});

test("released Action dogfood is pinned to the immutable package release", () => {
  const workflow = read(".github/workflows/deploy-pages.yml");
  const escapedTag = escapeRegExp(releaseTag);

  assert.match(
    workflow,
    new RegExp(`name: Released Action dogfood · ${escapedTag}`, "u"),
  );
  assert.match(
    workflow,
    new RegExp(`name: Review with published Coding Bible ${escapedTag}`, "u"),
  );
  assert.match(
    workflow,
    new RegExp(`uses: Xanhast-pf/coding-bible@${escapedTag}`, "u"),
  );

  const publishedPins = [
    ...workflow.matchAll(/uses: Xanhast-pf\/coding-bible@(v\d+\.\d+\.\d+)/gu),
  ].map((match) => match[1]);
  assert.deepEqual(publishedPins, [releaseTag]);
});
