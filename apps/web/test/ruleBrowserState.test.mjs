import assert from "node:assert/strict";
import test from "node:test";

import {
  createRuleBrowserSearchParams,
  parseRuleBrowserState,
} from "../src/utils/ruleBrowserState.ts";

const levels = ["must", "should", "prefer", "avoid"];
const packs = ["core", "react", "typescript"];

test("parseRuleBrowserState accepts known filters and preserves the query", () => {
  const state = parseRuleBrowserState(
    new URLSearchParams("q=state&pack=react&level=must"),
    levels,
    packs,
  );

  assert.deepEqual(state, {
    level: "must",
    pack: "react",
    query: "state",
  });
});

test("parseRuleBrowserState rejects unknown enum-like URL values", () => {
  const state = parseRuleBrowserState(
    new URLSearchParams("pack=angular&level=critical"),
    levels,
    packs,
  );

  assert.deepEqual(state, {
    level: "all",
    pack: "all",
    query: "",
  });
});

test("createRuleBrowserSearchParams omits defaults and trims search input", () => {
  const defaults = createRuleBrowserSearchParams({
    level: "all",
    pack: "all",
    query: "   ",
  });
  const filtered = createRuleBrowserSearchParams({
    level: "should",
    pack: "typescript",
    query: "  unknown  ",
  });

  assert.equal(defaults.toString(), "");
  assert.equal(filtered.toString(), "q=unknown&pack=typescript&level=should");
});
