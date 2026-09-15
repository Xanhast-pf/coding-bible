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

const readWorkflowJob = (workflow, jobName) => {
  const lines = workflow.split(/\r?\n/u);
  const start = lines.findIndex((line) => line === `  ${jobName}:`);
  assert.notEqual(start, -1, `Workflow job ${jobName} was not found.`);

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^ {2}[A-Za-z0-9_-]+:\s*$/u.test(lines[index] ?? "")) {
      end = index;
      break;
    }
  }

  return lines.slice(start, end).join("\n");
};

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

test("current branch Action dogfoods the current repository", () => {
  const workflow = read(".github/workflows/deploy-pages.yml");
  const job = readWorkflowJob(workflow, "action-smoke");

  assert.match(job, /name: Current branch Action dogfood/u);
  assert.match(job, /name: Dogfood current branch GitHub Action/u);
  assert.match(job, /^ {8}uses: \.\/$/mu);
  assert.match(job, /^ {10}scope: project$/mu);
  assert.match(job, /^ {10}fail-on: error$/mu);
});

test("published Action compatibility smoke is pinned and isolated from current source", () => {
  assert.ok(
    compareSemver(publishedVersion, sourceVersion) <= 0,
    `Published Action ${publishedVersion} cannot be newer than source ${sourceVersion}.`,
  );

  const workflow = read(".github/workflows/deploy-pages.yml");
  const job = readWorkflowJob(workflow, "released-action");
  const escapedTag = escapeRegExp(publishedTag);

  assert.match(
    job,
    new RegExp(
      `name: Released Action compatibility smoke · ${escapedTag}`,
      "u",
    ),
  );
  assert.match(
    job,
    new RegExp(
      `name: Review compatibility fixture with published Coding Bible ${escapedTag}`,
      "u",
    ),
  );
  assert.match(
    job,
    new RegExp(`uses: Xanhast-pf/coding-bible@${escapedTag}`, "u"),
  );
  assert.match(
    job,
    /^ {10}path: scripts\/fixtures\/released-action-smoke\/src$/mu,
  );
  assert.match(
    job,
    /^ {10}config: scripts\/fixtures\/released-action-smoke\/coding-bible\.config\.json$/mu,
  );
  assert.match(job, /^ {10}baseline: false$/mu);

  const publishedPins = [
    ...workflow.matchAll(/uses: Xanhast-pf\/coding-bible@(v\d+\.\d+\.\d+)/gu),
  ].map((match) => match[1]);
  assert.deepEqual(publishedPins, [publishedTag]);

  const fixtureConfig = JSON.parse(
    read("scripts/fixtures/released-action-smoke/coding-bible.config.json"),
  );
  assert.deepEqual(fixtureConfig.include, ["src/**/*"]);
  assert.match(
    read("scripts/fixtures/released-action-smoke/src/clean.ts"),
    /export const releasedActionSmoke = true;/u,
  );
});
