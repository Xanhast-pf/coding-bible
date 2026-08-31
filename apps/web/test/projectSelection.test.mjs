import assert from "node:assert/strict";
import test from "node:test";

import {
  getProjectResourceWarning,
  readProjectFiles,
} from "../src/analyzer/projectIngestion.ts";

const makeCandidate = (index, readSource = async () => "export {};") => ({
  file: { text: readSource },
  fileName: `src/file-${index}.ts`,
});

test("browser ingestion accepts projects beyond the previous file cap", async () => {
  const candidates = Array.from({ length: 2_501 }, (_, index) =>
    makeCandidate(index),
  );

  const files = await readProjectFiles(candidates);

  assert.equal(files.length, 2_501);
  assert.match(getProjectResourceWarning(files.length, 1) ?? "", /2,501/);
});

test("browser project reads use bounded concurrency", async () => {
  let activeReads = 0;
  let peakReads = 0;
  const candidates = Array.from({ length: 96 }, (_, index) =>
    makeCandidate(index, async () => {
      activeReads += 1;
      peakReads = Math.max(peakReads, activeReads);
      await new Promise((resolve) => setTimeout(resolve, 2));
      activeReads -= 1;
      return "export {};";
    }),
  );

  await readProjectFiles(candidates);

  assert.ok(peakReads > 1);
  assert.ok(peakReads <= 24);
});

test("browser project reads can be cancelled", async () => {
  const controller = new AbortController();
  const candidates = Array.from({ length: 96 }, (_, index) =>
    makeCandidate(index, async () => {
      await new Promise((resolve) => setTimeout(resolve, 2));
      return "export {};";
    }),
  );

  await assert.rejects(
    readProjectFiles(candidates, {
      onProgress: ({ completed }) => {
        if (completed === 1) {
          controller.abort();
        }
      },
      signal: controller.signal,
    }),
    (error) => error instanceof DOMException && error.name === "AbortError",
  );
});

test("resource warnings remain soft at the previous browser thresholds", () => {
  assert.equal(getProjectResourceWarning(2_500, 32 * 1024 * 1024), null);
  assert.match(getProjectResourceWarning(2_501, 1) ?? "", /2,501/);
  assert.match(
    getProjectResourceWarning(1, 32 * 1024 * 1024 + 1) ?? "",
    /32\.0 MB/,
  );
});
