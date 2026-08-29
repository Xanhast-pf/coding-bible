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
    sarif: true,
    scope: "changed",
  });
});

test("action inputs parse explicit policy", () => {
  assert.deepEqual(
    readActionInputs({
      INPUT_ANNOTATIONS: "false",
      INPUT_BASE_REF: "origin/main",
      INPUT_BASELINE: "false",
      INPUT_CONFIG: "config/coding-bible.mjs",
      INPUT_FAIL_ON: "warning",
      INPUT_PATH: "src",
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
      sarif: false,
      scope: "project",
    },
  );
});

test("action inputs reject unsupported values", () => {
  assert.throws(
    () => readActionInputs({ INPUT_FAIL_ON: "fatal" }),
    /fail-on must be one of/u,
  );
  assert.throws(
    () => readActionInputs({ INPUT_BASELINE: "sometimes" }),
    /baseline must be true or false/u,
  );
});
