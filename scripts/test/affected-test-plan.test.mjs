import assert from "node:assert/strict";
import test from "node:test";
import { planAffectedTests } from "../affected-test-plan.mjs";

const allTargets = [
  "@coding-bible/rules",
  "@coding-bible/analyzer",
  "@coding-bible/action",
  "@coding-bible/mcp",
  "@coding-bible/web",
];

test("rules changes run rules and downstream consumer tests", () => {
  assert.deepEqual(planAffectedTests(["packages/rules/src/index.ts"]), [
    "@coding-bible/rules",
    "@coding-bible/action",
    "@coding-bible/mcp",
    "@coding-bible/web",
  ]);
});

test("analyzer changes run analyzer and downstream consumer tests", () => {
  assert.deepEqual(planAffectedTests(["packages/analyzer/src/analyze.ts"]), [
    "@coding-bible/analyzer",
    "@coding-bible/action",
    "@coding-bible/mcp",
    "@coding-bible/web",
  ]);
});

test("action-only changes run action tests only", () => {
  assert.deepEqual(planAffectedTests(["packages/action/src/index.mjs"]), [
    "@coding-bible/action",
  ]);
});

test("mcp-only changes run mcp tests only", () => {
  assert.deepEqual(planAffectedTests(["packages/mcp/src/server.ts"]), [
    "@coding-bible/mcp",
  ]);
});

test("web-only changes run web tests only", () => {
  assert.deepEqual(planAffectedTests(["apps/web/src/App.tsx"]), [
    "@coding-bible/web",
  ]);
});

test("root tooling changes run the complete test suite", () => {
  assert.deepEqual(planAffectedTests(["eslint.config.mjs"]), allTargets);
  assert.deepEqual(
    planAffectedTests(["scripts/run-precommit.mjs"]),
    allTargets,
  );
});

test("documentation-only changes do not run workspace tests", () => {
  assert.deepEqual(planAffectedTests(["docs/rule-authoring.md"]), []);
});

test("unknown workspace changes fail safe by running every target", () => {
  assert.deepEqual(
    planAffectedTests(["packages/new-package/src/index.ts"]),
    allTargets,
  );
});
