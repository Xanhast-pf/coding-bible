import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { checkPaths, collectSourceFiles } from "../cli/check.mjs";
import { runCli } from "../cli/run.mjs";

const withFixture = async (callback) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "coding-bible-cli-"));

  try {
    await callback(directory);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
};

const createWriter = () => {
  let value = "";

  return {
    get value() {
      return value;
    },
    write(chunk) {
      value += String(chunk);
      return true;
    },
  };
};

test("collectSourceFiles walks supported source files and ignores generated directories", async () => {
  await withFixture(async (directory) => {
    await mkdir(path.join(directory, "src"), { recursive: true });
    await mkdir(path.join(directory, "node_modules", "dependency"), { recursive: true });
    await writeFile(path.join(directory, "src", "good.ts"), "const value = 1;\n");
    await writeFile(path.join(directory, "src", "view.tsx"), "export const View = () => <div />;\n");
    await writeFile(path.join(directory, "src", "notes.md"), "ignore me\n");
    await writeFile(path.join(directory, "node_modules", "dependency", "bad.ts"), "const value: any = 1;\n");

    const files = await collectSourceFiles(["."], { cwd: directory });

    assert.deepEqual(
      files.map((filePath) => path.relative(directory, filePath)),
      [path.join("src", "good.ts"), path.join("src", "view.tsx")],
    );
  });
});

test("checkPaths returns file-aware analyzer findings", async () => {
  await withFixture(async (directory) => {
    await mkdir(path.join(directory, "src"), { recursive: true });
    await writeFile(path.join(directory, "src", "bad.ts"), "const value: any = 1;\n");

    const result = await checkPaths(["src"], { cwd: directory });

    assert.equal(result.filesScanned, 1);
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0]?.filePath, path.join("src", "bad.ts"));
    assert.equal(result.findings[0]?.ruleId, "TS-001");
    assert.equal(result.ruleIdsChecked.length, 19);
  });
});

test("runCli exits non-zero for findings and supports JSON output", async () => {
  await withFixture(async (directory) => {
    await writeFile(path.join(directory, "bad.ts"), "const value: any = 1;\n");
    const stdout = createWriter();
    const stderr = createWriter();

    const exitCode = await runCli(["check", ".", "--json"], {
      cwd: directory,
      stderr,
      stdout,
    });
    const result = JSON.parse(stdout.value);

    assert.equal(exitCode, 1);
    assert.equal(stderr.value, "");
    assert.equal(result.findings[0].ruleId, "TS-001");
    assert.equal(result.ruleIdsChecked.length, 19);
  });
});


test("CLI clean summary states automated coverage instead of implying a full review", async () => {
  await withFixture(async (directory) => {
    await writeFile(path.join(directory, "good.ts"), "const value = 1;\n");
    const stdout = createWriter();
    const stderr = createWriter();

    const exitCode = await runCli(["check", "."], {
      cwd: directory,
      stderr,
      stdout,
    });

    assert.equal(exitCode, 0);
    assert.equal(stderr.value, "");
    assert.match(stdout.value, /19 automated rules/);
    assert.doesNotMatch(stdout.value, /found no issues/);
  });
});
