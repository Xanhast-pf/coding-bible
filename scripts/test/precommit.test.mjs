import assert from "node:assert/strict";
import test from "node:test";
import { isBypassed } from "../run-precommit.mjs";

test("pre-commit bypass flags accept explicit truthy values", () => {
  for (const value of ["1", "true", "TRUE", "yes", "on"]) {
    assert.equal(isBypassed(value), true);
  }
});

test("pre-commit bypass flags stay enabled by default", () => {
  for (const value of [undefined, "", "0", "false", "no", "off"]) {
    assert.equal(isBypassed(value), false);
  }
});
