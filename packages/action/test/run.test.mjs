import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";

import { runAction } from "../src/run.mjs";

test("Action preserves custom-rule metadata in annotations, summary, and SARIF", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-action-custom-"),
  );
  await mkdir(path.join(root, "src"));
  await writeFile(
    path.join(root, "coding-bible.config.json"),
    JSON.stringify({
      customRules: [
        {
          id: "ACME-001",
          title: "Avoid dangerous",
          rationale: "Custom project policy.",
          message: "Do not call dangerous().",
          suggestion: "Use safeAlternative().",
          confidence: "strong",
          impact: "high",
          url: "https://example.com/rules/ACME-001",
          match: { kind: "call", callee: "dangerous" },
        },
      ],
    }),
  );
  await writeFile(path.join(root, "src", "example.ts"), "dangerous();\n");

  const outputPath = path.join(root, "outputs.txt");
  const summaryPath = path.join(root, "summary.md");
  const stream = new PassThrough();
  let log = "";
  stream.on("data", (chunk) => {
    log += chunk.toString();
  });

  const result = await runAction({
    cwd: root,
    environment: {
      GITHUB_OUTPUT: outputPath,
      GITHUB_STEP_SUMMARY: summaryPath,
      INPUT_SCOPE: "project",
      INPUT_FAIL_ON: "none",
      INPUT_BASELINE: "false",
      INPUT_ANNOTATIONS: "true",
      INPUT_SARIF: "true",
    },
    stream,
  });
  stream.end();
  await new Promise((resolve) => stream.on("end", resolve));

  assert.equal(result.failed, false);
  assert.match(log, /title=ACME-001 · Avoid dangerous/u);
  assert.match(log, /https:\/\/example\.com\/rules\/ACME-001/u);

  const summary = await readFile(summaryPath, "utf8");
  assert.match(
    summary,
    /\[ACME-001\]\(https:\/\/example\.com\/rules\/ACME-001\) · Avoid dangerous/u,
  );

  const sarif = JSON.parse(
    await readFile(
      path.join(root, ".coding-bible", "coding-bible.sarif"),
      "utf8",
    ),
  );
  const descriptor = sarif.runs[0].tool.driver.rules.find(
    ({ id }) => id === "ACME-001",
  );
  assert.deepEqual(descriptor, {
    id: "ACME-001",
    name: "Avoid dangerous",
    shortDescription: { text: "Custom project policy." },
    helpUri: "https://example.com/rules/ACME-001",
    properties: { source: "finding" },
  });
});
