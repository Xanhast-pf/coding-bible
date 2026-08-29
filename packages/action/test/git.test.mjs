import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { resolveBaseRef } from "../src/git.mjs";

test("base ref prefers explicit input", async () => {
  assert.equal(
    await resolveBaseRef({ baseRef: "release-base", environment: {} }),
    "release-base",
  );
});

test("base ref uses pull request base SHA from the GitHub event", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-event-"),
  );
  const eventPath = path.join(directory, "event.json");
  await writeFile(
    eventPath,
    JSON.stringify({ pull_request: { base: { sha: "abc123" } } }),
  );

  assert.equal(
    await resolveBaseRef({
      baseRef: null,
      environment: { GITHUB_EVENT_PATH: eventPath },
    }),
    "abc123",
  );
});
