import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const script = path.join(root, "scripts/verify-release-tag.mjs");
const sourceVersion = JSON.parse(
  fs.readFileSync(path.join(root, "packages/action/package.json"), "utf8"),
).version;

const run = (tag) =>
  spawnSync(process.execPath, [script, tag], {
    cwd: root,
    encoding: "utf8",
  });

test("release tag preflight accepts the exact source version", () => {
  const result = run(`v${sourceVersion}`);

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /matches Action\/MCP source versions and release notes/u,
  );
});

test("release tag preflight rejects malformed or mismatched tags", () => {
  const malformed = run(sourceVersion);
  assert.equal(malformed.status, 2);
  assert.match(malformed.stderr, /vMAJOR\.MINOR\.PATCH/u);

  const [major, minor, patch] = sourceVersion.split(".").map(Number);
  const mismatched = run(`v${major}.${minor}.${patch + 1}`);
  assert.equal(mismatched.status, 1);
  assert.match(mismatched.stderr, /does not match source versions/u);
});

test("release tags are wired into the repository quality workflow", () => {
  const workflow = fs.readFileSync(
    path.join(root, ".github/workflows/deploy-pages.yml"),
    "utf8",
  );

  assert.match(workflow, /tags:\n\s+- "v\*\.\*\.\*"/u);
  assert.match(workflow, /if: startsWith\(github\.ref, 'refs\/tags\/v'\)/u);
  assert.match(workflow, /run: pnpm release:tag:check -- "\$GITHUB_REF_NAME"/u);
});

test("self-contained Action smoke cannot false-green without exercising the analyzer", () => {
  const workflow = fs.readFileSync(
    path.join(root, ".github/workflows/deploy-pages.yml"),
    "utf8",
  );

  assert.match(
    workflow,
    /name: Dogfood GitHub Action runtime\n\s+id: smoke\n\s+uses: \.\/\n\s+with:\n\s+scope: project/u,
  );
  assert.match(
    workflow,
    /FILES_ANALYZED: \$\{\{ steps\.smoke\.outputs\.files-analyzed \}\}/u,
  );
  assert.match(
    workflow,
    /RULES_CHECKED: \$\{\{ steps\.smoke\.outputs\.rules-checked \}\}/u,
  );
  assert.match(workflow, /test "\$FILES_ANALYZED" -gt 0/u);
  assert.match(workflow, /test "\$RULES_CHECKED" -gt 0/u);
});
