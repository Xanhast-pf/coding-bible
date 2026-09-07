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
const mcpPackage = JSON.parse(read("packages/mcp/package.json"));
const releaseState = JSON.parse(read("packages/action/release-state.json"));
const sourceVersion = actionPackage.version;
const publishedVersion = releaseState.publishedActionVersion;
const publishedTag = `v${publishedVersion}`;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

const parseSemver = (value) => {
  assert.match(value, /^\d+\.\d+\.\d+$/u);
  return value.split(".").map(Number);
};

const compareSemver = (left, right) => {
  const a = parseSemver(left);
  const b = parseSemver(right);
  for (let index = 0; index < 3; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference) return difference;
  }
  return 0;
};

test("Action and MCP versions match the source package version", () => {
  assert.equal(mcpPackage.version, sourceVersion);

  const constants = read("packages/action/src/constants.mjs");
  assert.match(
    constants,
    new RegExp(
      `export const actionVersion = "${escapeRegExp(sourceVersion)}";`,
      "u",
    ),
  );

  const mcpConstants = read("packages/mcp/src/constants.ts");
  assert.match(
    mcpConstants,
    new RegExp(
      `export const codingBibleMcpVersion = "${escapeRegExp(sourceVersion)}";`,
      "u",
    ),
  );
});

test("published Action dogfood is independently pinned to an immutable released version", () => {
  assert.ok(
    compareSemver(publishedVersion, sourceVersion) <= 0,
    `Published Action ${publishedVersion} cannot be newer than source ${sourceVersion}.`,
  );

  const workflow = read(".github/workflows/deploy-pages.yml");
  const escapedTag = escapeRegExp(publishedTag);

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
  assert.deepEqual(publishedPins, [publishedTag]);
});
