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

test("changed diff preserves pure renames instead of treating every line as new", async () => {
  const { mkdir, rename } = await import("node:fs/promises");
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const { getChangedDiff } = await import("../src/git.mjs");
  const { parseGitDiff } = await import("../src/diff.mjs");
  const exec = promisify(execFile);
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-action-rename-"),
  );
  await exec("git", ["init", "-q"], { cwd: directory });
  await exec("git", ["config", "user.email", "coding-bible@example.invalid"], {
    cwd: directory,
  });
  await exec("git", ["config", "user.name", "Coding Bible Test"], {
    cwd: directory,
  });
  await mkdir(path.join(directory, "src"));
  await writeFile(
    path.join(directory, "src", "old.ts"),
    "export const parse = (value: any) => value;\n",
  );
  await exec("git", ["add", "."], { cwd: directory });
  await exec("git", ["commit", "-qm", "base"], { cwd: directory });
  const { stdout: base } = await exec("git", ["rev-parse", "HEAD"], {
    cwd: directory,
  });

  await rename(
    path.join(directory, "src", "old.ts"),
    path.join(directory, "src", "new.ts"),
  );
  await exec("git", ["add", "-A"], { cwd: directory });
  await exec("git", ["commit", "-qm", "rename"], { cwd: directory });

  const diff = await getChangedDiff({
    cwd: directory,
    baseRef: base.trim(),
    targetPath: ".",
  });

  assert.match(diff, /similarity index 100%/u);
  assert.deepEqual(
    parseGitDiff(diff).filter(({ ranges }) => ranges.length > 0),
    [],
  );
});

test("changed diff keeps only edited lines when a file is renamed and modified", async () => {
  const { mkdir, rename } = await import("node:fs/promises");
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const { getChangedDiff } = await import("../src/git.mjs");
  const { parseGitDiff } = await import("../src/diff.mjs");
  const exec = promisify(execFile);
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-action-rename-edit-"),
  );
  await exec("git", ["init", "-q"], { cwd: directory });
  await exec("git", ["config", "user.email", "coding-bible@example.invalid"], {
    cwd: directory,
  });
  await exec("git", ["config", "user.name", "Coding Bible Test"], {
    cwd: directory,
  });
  await mkdir(path.join(directory, "src"));
  await writeFile(
    path.join(directory, "src", "old.ts"),
    [
      "export const one = 1;",
      "export const two = 2;",
      "export const three = 3;",
      "export const four = 4;",
      "export const five = 5;",
      "export const six = 6;",
      "export const seven = 7;",
      "export const eight = 8;",
      "export const nine = 9;",
      "export const ten = 10;",
      "",
    ].join("\n"),
  );
  await exec("git", ["add", "."], { cwd: directory });
  await exec("git", ["commit", "-qm", "base"], { cwd: directory });
  const { stdout: base } = await exec("git", ["rev-parse", "HEAD"], {
    cwd: directory,
  });

  await rename(
    path.join(directory, "src", "old.ts"),
    path.join(directory, "src", "new.ts"),
  );
  const renamedPath = path.join(directory, "src", "new.ts");
  const renamedSource = await import("node:fs/promises").then(({ readFile }) =>
    readFile(renamedPath, "utf8"),
  );
  await writeFile(
    renamedPath,
    renamedSource.replace("export const five = 5;", "export const five = 50;"),
  );
  await exec("git", ["add", "-A"], { cwd: directory });
  await exec("git", ["commit", "-qm", "rename and edit"], { cwd: directory });

  const diff = await getChangedDiff({
    cwd: directory,
    baseRef: base.trim(),
    targetPath: ".",
  });
  const changed = parseGitDiff(diff).filter(({ ranges }) => ranges.length > 0);

  assert.match(diff, /similarity index \d+%/u);
  assert.deepEqual(changed, [
    {
      file: "src/new.ts",
      ranges: [{ startLine: 5, endLine: 5 }],
    },
  ]);
});
