import assert from "node:assert/strict";
import test from "node:test";

import { readActionInputs } from "../src/inputs.mjs";

test("action inputs have safe zero-config defaults", () => {
  assert.deepEqual(readActionInputs({}), {
    annotations: true,
    baseRef: null,
    baseline: true,
    configPath: null,
    failOn: "error",
    path: ".",
    ruleSelection: {},
    sarif: true,
    scope: "changed",
  });
});

test("action inputs parse explicit policy", () => {
  assert.deepEqual(
    readActionInputs({
      INPUT_ANNOTATIONS: "false",
      "INPUT_BASE-REF": "origin/main",
      INPUT_BASELINE: "false",
      INPUT_CONFIG: "config/coding-bible.mjs",
      "INPUT_FAIL-ON": "warning",
      INPUT_PATH: "src",
      INPUT_RULES: "TS-001, REACT-006\nJS-004",
      "INPUT_EXCLUDE-RULES": "JS-004",
      INPUT_SARIF: "false",
      INPUT_SCOPE: "project",
    }),
    {
      annotations: false,
      baseRef: "origin/main",
      baseline: false,
      configPath: "config/coding-bible.mjs",
      failOn: "warning",
      path: "src",
      ruleSelection: {
        exclude: ["JS-004"],
        include: ["TS-001", "REACT-006", "JS-004"],
      },
      sarif: false,
      scope: "project",
    },
  );
});

test("action inputs prefer GitHub runner input keys and accept underscore fallbacks", () => {
  assert.equal(
    readActionInputs({
      "INPUT_FAIL-ON": "warning",
      INPUT_FAIL_ON: "none",
    }).failOn,
    "warning",
  );
  assert.equal(readActionInputs({ INPUT_FAIL_ON: "none" }).failOn, "none");
});

test("action inputs reject unsupported values", () => {
  assert.throws(
    () => readActionInputs({ "INPUT_FAIL-ON": "fatal" }),
    /fail-on must be one of/u,
  );
  assert.throws(
    () => readActionInputs({ INPUT_BASELINE: "sometimes" }),
    /baseline must be true or false/u,
  );
});
