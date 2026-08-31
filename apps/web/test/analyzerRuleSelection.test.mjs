import assert from "node:assert/strict";
import test from "node:test";

import { analyzerRuleIds } from "@coding-bible/analyzer";
import {
  browserRuleSelectionStorageKey,
  createRuleSelectionFromEnabledIds,
  getEnabledAnalyzerRuleIds,
  parseBrowserRuleSelection,
  readBrowserRuleSelection,
  writeBrowserRuleSelection,
} from "../src/analyzer/ruleSelection.ts";

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
    values,
  };
};

test("browser rule selection defaults to every automated rule", () => {
  assert.deepEqual(getEnabledAnalyzerRuleIds({}), analyzerRuleIds);
});

test("browser rule selection persists exclusions and recovers from malformed storage", () => {
  const storage = createStorage();
  const selection = createRuleSelectionFromEnabledIds(["TS-001", "TS-003"]);

  writeBrowserRuleSelection(selection, storage);
  assert.deepEqual(readBrowserRuleSelection(storage), selection);
  assert.ok(storage.values.has(browserRuleSelectionStorageKey));

  storage.setItem(browserRuleSelectionStorageKey, "{broken");
  assert.deepEqual(readBrowserRuleSelection(storage), {});
  assert.deepEqual(parseBrowserRuleSelection(null), {});
});

test("enabling every rule removes the localStorage override", () => {
  const storage = createStorage();
  storage.setItem(
    browserRuleSelectionStorageKey,
    JSON.stringify({ exclude: ["TS-001"] }),
  );
  writeBrowserRuleSelection({}, storage);
  assert.equal(storage.getItem(browserRuleSelectionStorageKey), null);
});

test("browser rule selection tolerates blocked localStorage", () => {
  const blockedStorage = {
    getItem: () => {
      throw new DOMException("blocked", "SecurityError");
    },
    removeItem: () => {
      throw new DOMException("blocked", "SecurityError");
    },
    setItem: () => {
      throw new DOMException("blocked", "SecurityError");
    },
  };

  assert.deepEqual(readBrowserRuleSelection(blockedStorage), {});
  assert.doesNotThrow(() =>
    writeBrowserRuleSelection({ exclude: ["TS-001"] }, blockedStorage),
  );
  assert.doesNotThrow(() => writeBrowserRuleSelection({}, blockedStorage));
});
