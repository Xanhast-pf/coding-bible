import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const { scripts } = packageJson;

test("local check heals deterministic drift before strict verification", () => {
  assert.equal(
    scripts.check,
    "pnpm generate && pnpm lint:fix && pnpm format && pnpm check:verify",
  );
  assert.equal(
    scripts.generate,
    "pnpm registries:generate && pnpm automation:matrix:generate && pnpm rulebook:schema:generate && pnpm agent:generate && pnpm action:build",
  );
});

test("strict verification is ordered and does not call mutating generators", () => {
  assert.equal(scripts["check:ci"], "pnpm check:verify");
  assert.equal(
    scripts["check:verify"],
    "pnpm generate:check && pnpm format:check && pnpm lint && pnpm typecheck && pnpm knip && pnpm test && pnpm build:packages && pnpm bible:check",
  );
  assert.equal(
    scripts["generate:check"],
    "pnpm registries:check && pnpm automation:matrix:check && pnpm rulebook:schema:check && pnpm agent:check && pnpm action:check",
  );
  assert.doesNotMatch(scripts["check:verify"], /:generate\b/u);
  assert.doesNotMatch(scripts["check:verify"], /lint:fix|prettier --write/u);
});

test("package builds do not regenerate the committed Action runtime late", () => {
  assert.equal(
    scripts["build:packages"],
    "pnpm -r --filter='!@coding-bible/action' --if-present build",
  );
  assert.equal(scripts.build, "pnpm generate && pnpm build:packages");
});

test("pre-push and GitHub Actions use the strict non-healing gate", () => {
  assert.equal(scripts.prepush, "pnpm check:ci");

  const workflow = fs.readFileSync(
    path.join(root, ".github/workflows/deploy-pages.yml"),
    "utf8",
  );
  assert.match(workflow, /run: pnpm check:ci/u);
  assert.doesNotMatch(workflow, /^\s*run: pnpm check\s*$/mu);
});
