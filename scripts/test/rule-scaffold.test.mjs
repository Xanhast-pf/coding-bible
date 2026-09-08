import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createDetectorContent,
  createRuleContent,
  resolveRuleScaffoldPlan,
} from "../rules/new-rule.mjs";

const withTempRoot = (callback) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "coding-bible-rule-new-"));
  try {
    return callback(root);
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
};

const write = (root, relativePath, content = "// fixture\n") => {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

test("rule:new can add a detector scaffold to an existing canonical rule", () => {
  withTempRoot((root) => {
    write(
      root,
      "packages/rules/src/rules/apollo/APOLLO-004-reconcile-mutation-results-explicitly.ts",
    );

    const plan = resolveRuleScaffoldPlan({
      rootDirectory: root,
      id: "APOLLO-004",
      title: null,
      createDetector: true,
    });

    assert.equal(plan.createCanonicalRule, false);
    assert.equal(
      plan.fileName,
      "APOLLO-004-reconcile-mutation-results-explicitly.ts",
    );
    assert.equal(plan.fileSlug, "reconcile-mutation-results-explicitly");
    assert.equal(
      path.relative(root, plan.detectorFile),
      "packages/analyzer/src/detectors/apollo/APOLLO-004-reconcile-mutation-results-explicitly.ts",
    );
  });
});

test("rule:new still rejects duplicate canonical rules without --detector", () => {
  withTempRoot((root) => {
    write(
      root,
      "packages/rules/src/rules/react/REACT-006-use-stable-list-keys.ts",
    );

    assert.throws(
      () =>
        resolveRuleScaffoldPlan({
          rootDirectory: root,
          id: "REACT-006",
          title: "Use stable list keys",
          createDetector: false,
        }),
      /already exists/u,
    );
  });
});

test("rule:new refuses to overwrite an existing detector", () => {
  withTempRoot((root) => {
    const fileName = "REACT-006-use-stable-list-keys.ts";
    write(root, `packages/rules/src/rules/react/${fileName}`);
    write(root, `packages/analyzer/src/detectors/react/${fileName}`);

    assert.throws(
      () =>
        resolveRuleScaffoldPlan({
          rootDirectory: root,
          id: "REACT-006",
          title: null,
          createDetector: true,
        }),
      /already has an analyzer module/u,
    );
  });
});

test("rule:new requires a title only when creating a new canonical rule", () => {
  withTempRoot((root) => {
    assert.throws(
      () =>
        resolveRuleScaffoldPlan({
          rootDirectory: root,
          id: "REACT-014",
          title: null,
          createDetector: true,
        }),
      /--title is required/u,
    );

    const plan = resolveRuleScaffoldPlan({
      rootDirectory: root,
      id: "REACT-014",
      title: "Prefer explicit event ownership",
      createDetector: true,
    });
    assert.equal(plan.createCanonicalRule, true);
    assert.equal(plan.fileName, "REACT-014-prefer-explicit-event-ownership.ts");
    assert.match(createRuleContent(plan), /detectable: true/u);
    assert.match(
      createDetectorContent(plan),
      /id: "react-014-prefer-explicit-event-ownership"/u,
    );
  });
});

test("rule:new usage does not recommend promoting a contextual candidate", () => {
  const result = spawnSync(
    process.execPath,
    [path.resolve("scripts/rules/new-rule.mjs")],
    {
      cwd: path.resolve("."),
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\$RULE_ID/u);
  assert.doesNotMatch(result.stderr, /APOLLO-004/u);
});
