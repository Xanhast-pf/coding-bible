import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { actionVersion } from "../src/constants.mjs";

test("action runtime version matches its workspace package", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.equal(actionVersion, packageJson.version);
});
