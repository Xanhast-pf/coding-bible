import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const script = path.join(root, "scripts/rules/generate-agent-prompt.mjs");

const runPrompt = (args) =>
  spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: "utf8",
  });

test("rule:prompt emits a focused auto-mode implementation brief", () => {
  const result = runPrompt([
    "--id",
    "ACME-004",
    "--title",
    "Use the shared HTTP client",
    "--goal",
    "Application code must not call fetch directly outside the approved HTTP boundary.",
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ACME-004/u);
  assert.match(result.stdout, /Use the shared HTTP client/u);
  assert.match(result.stdout, /Requested mode:\*\* auto/u);
  assert.match(result.stdout, /First decide whether the current declarative/u);
  assert.match(result.stdout, /organization-specific policy/u);
  assert.match(result.stdout, /Do not invent declarative matcher syntax/u);
  assert.match(result.stdout, /pnpm check/u);
});

test("rule:prompt detector mode points canonical rules at the detector scaffold", () => {
  const result = runPrompt([
    "--id",
    "APOLLO-004",
    "--title",
    "Prefer typed cache policies",
    "--goal",
    "Detect cache policy definitions that bypass the typed project abstraction.",
    "--mode",
    "detector",
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /pnpm rule:new -- --id APOLLO-004 --title "Prefer typed cache policies" --detector/u,
  );
  assert.match(result.stdout, /full analyzer detector/u);
});

test("rule:prompt can write a reusable Markdown brief", () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "coding-bible-prompt-"),
  );
  try {
    const output = path.join(directory, "ACME-005.md");
    const result = runPrompt([
      "--id",
      "ACME-005",
      "--title",
      "Use the analytics wrapper",
      "--goal",
      "Raw analytics imports are forbidden in application code.",
      "--context",
      "src/platform/analytics",
      "--output",
      output,
    ]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Wrote /u);
    const prompt = fs.readFileSync(output, "utf8");
    assert.match(prompt, /src\/platform\/analytics/u);
    assert.match(prompt, /Raw analytics imports are forbidden/u);
  } finally {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

test("rule:prompt rejects malformed IDs and conflicting goal sources", () => {
  const badId = runPrompt([
    "--id",
    "acme-4",
    "--title",
    "Bad ID",
    "--goal",
    "Example",
  ]);
  assert.equal(badId.status, 2);
  assert.match(badId.stderr, /PREFIX-000/u);

  const conflict = runPrompt([
    "--id",
    "ACME-006",
    "--title",
    "Conflicting goal",
    "--goal",
    "Inline",
    "--goal-file",
    "goal.txt",
  ]);
  assert.equal(conflict.status, 2);
  assert.match(conflict.stderr, /either --goal or --goal-file/u);
});
