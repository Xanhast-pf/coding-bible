import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runCli } from "../cli/run.mjs";

const withFixture = async (callback) => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-remediation-"),
  );
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

test("baseline status classifies active, stale, and new findings while prune never absorbs new debt", async () => {
  await withFixture(async (directory) => {
    const filePath = path.join(directory, "bad.ts");
    await writeFile(filePath, "const value: any = 1;\n");

    assert.equal(
      await runCli(["baseline", "create", "."], {
        cwd: directory,
        stderr: createWriter(),
        stdout: createWriter(),
      }),
      0,
    );

    const activeOutput = createWriter();
    assert.equal(
      await runCli(["baseline", "status", ".", "--json"], {
        cwd: directory,
        stderr: createWriter(),
        stdout: activeOutput,
      }),
      0,
    );
    assert.deepEqual(
      (({ active, stale, new: fresh }) => ({ active, stale, new: fresh }))(
        JSON.parse(activeOutput.value),
      ),
      { active: 1, stale: 0, new: 0 },
    );

    await writeFile(filePath, "const changed: any = 1;\n");
    const changedOutput = createWriter();
    assert.equal(
      await runCli(["baseline", "status", ".", "--json"], {
        cwd: directory,
        stderr: createWriter(),
        stdout: changedOutput,
      }),
      0,
    );
    const changed = JSON.parse(changedOutput.value);
    assert.equal(changed.active, 0);
    assert.equal(changed.stale, 1);
    assert.equal(changed.new, 1);

    const pruneOutput = createWriter();
    assert.equal(
      await runCli(["baseline", "prune", "."], {
        cwd: directory,
        stderr: createWriter(),
        stdout: pruneOutput,
      }),
      0,
    );
    assert.match(pruneOutput.value, /1 stale baseline entry/u);
    assert.match(pruneOutput.value, /1 new finding was not baselined/u);

    const baseline = JSON.parse(
      await readFile(
        path.join(directory, ".coding-bible-baseline.json"),
        "utf8",
      ),
    );
    assert.equal(baseline.findings.length, 0);

    const afterOutput = createWriter();
    await runCli(["baseline", "status", ".", "--json"], {
      cwd: directory,
      stderr: createWriter(),
      stdout: afterOutput,
    });
    const after = JSON.parse(afterOutput.value);
    assert.equal(after.active, 0);
    assert.equal(after.stale, 0);
    assert.equal(after.new, 1);
  });
});

test("--fix-pack emits report, safe/review patches, prioritized plan, and Review Brief", async () => {
  await withFixture(async (directory) => {
    await writeFile(
      path.join(directory, "types.ts"),
      "export interface User { id: string }\n",
    );
    await writeFile(
      path.join(directory, "bad.ts"),
      `import { User } from "./types";\n\nexport const prepare = (input: number[], user: User) => {\n  const sorted = input.sort();\n  return { sorted, user };\n};\n`,
    );

    const stdout = createWriter();
    const exitCode = await runCli(["check", ".", "--fix-pack", "--no-cache"], {
      cwd: directory,
      stderr: createWriter(),
      stdout,
    });
    assert.equal(exitCode, 1);

    const artifactDir = path.join(directory, ".coding-bible");
    const report = JSON.parse(
      await readFile(path.join(artifactDir, "report.json"), "utf8"),
    );
    const fixPack = JSON.parse(
      await readFile(path.join(artifactDir, "fix-pack.json"), "utf8"),
    );
    const reviewBrief = await readFile(
      path.join(artifactDir, "review-brief.md"),
      "utf8",
    );
    const safePatch = await readFile(
      path.join(artifactDir, "safe-fixes.patch"),
      "utf8",
    );
    const reviewPatch = await readFile(
      path.join(artifactDir, "review-fixes.patch"),
      "utf8",
    );

    assert.ok(report.findings.some(({ ruleId }) => ruleId === "TS-003"));
    assert.ok(report.findings.some(({ ruleId }) => ruleId === "JS-006"));
    assert.ok(fixPack.reviewOrder.length >= 2);
    assert.ok(fixPack.summary.safeFixes >= 1);
    assert.ok(fixPack.summary.reviewFixes >= 1);
    assert.match(reviewBrief, /Coding Bible Review Brief/u);
    assert.match(reviewBrief, /Review order/u);
    assert.match(safePatch, /type User/u);
    assert.match(reviewPatch, /toSorted/u);
    assert.match(stdout.value, /fix-pack\.json/u);
    assert.match(stdout.value, /review-brief\.md/u);
  });
});
