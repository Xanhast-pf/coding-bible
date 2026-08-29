import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { checkPaths, collectSourceFiles } from "../cli/check.mjs";
import { compileGlobs, matchesAnyGlob } from "../cli/glob.mjs";
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

test("config globs support recursive matches and brace expansion", () => {
  const globs = compileGlobs(["**/*.test.{ts,tsx}", "src/generated/**"]);

  assert.equal(matchesAnyGlob("Button.test.tsx", globs), true);
  assert.equal(matchesAnyGlob("src/Button.test.ts", globs), true);
  assert.equal(matchesAnyGlob("src/generated/client.ts", globs), true);
  assert.equal(matchesAnyGlob("src/Button.tsx", globs), false);
});

test("collectSourceFiles walks supported source files and ignores generated directories", async () => {
  await withFixture(async (directory) => {
    await mkdir(path.join(directory, "src"), { recursive: true });
    await mkdir(path.join(directory, "node_modules", "dependency"), {
      recursive: true,
    });
    await writeFile(
      path.join(directory, "src", "good.ts"),
      "const value = 1;\n",
    );
    await writeFile(
      path.join(directory, "src", "view.tsx"),
      "export const View = () => <div />;\n",
    );
    await writeFile(
      path.join(directory, "src", "script.mjs"),
      "export const script = 1;\n",
    );
    await writeFile(
      path.join(directory, "src", "module.mts"),
      "export const moduleValue = 1;\n",
    );
    await writeFile(path.join(directory, "src", "notes.md"), "ignore me\n");
    await writeFile(
      path.join(directory, "node_modules", "dependency", "bad.ts"),
      "const value: any = 1;\n",
    );

    const files = await collectSourceFiles(["."], { cwd: directory });

    assert.deepEqual(
      files.map((filePath) => path.relative(directory, filePath)),
      [
        path.join("src", "good.ts"),
        path.join("src", "module.mts"),
        path.join("src", "script.mjs"),
        path.join("src", "view.tsx"),
      ],
    );
  });
});

test("checkPaths returns file-aware analyzer findings", async () => {
  await withFixture(async (directory) => {
    await mkdir(path.join(directory, "src"), { recursive: true });
    await writeFile(
      path.join(directory, "src", "bad.ts"),
      "const value: any = 1;\n",
    );

    const result = await checkPaths(["src"], { cwd: directory });

    assert.equal(result.filesScanned, 1);
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0]?.filePath, path.join("src", "bad.ts"));
    assert.equal(result.findings[0]?.ruleId, "TS-001");
    assert.equal(result.ruleIdsChecked.length, 11);
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
    assert.equal(result.ruleIdsChecked.length, 11);
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
    assert.match(stdout.value, /11 applicable automated rules/);
    assert.doesNotMatch(stdout.value, /found no issues/);
  });
});

test("CLI reports syntax errors and exits non-zero before rule findings", async () => {
  await withFixture(async (directory) => {
    await writeFile(
      path.join(directory, "broken.tsx"),
      "const View = () => <div>\n",
    );
    const stdout = createWriter();
    const stderr = createWriter();

    const exitCode = await runCli(["check", "."], {
      cwd: directory,
      stderr,
      stdout,
    });

    assert.equal(exitCode, 1);
    assert.equal(stderr.value, "");
    assert.match(stdout.value, /syntax issue/);
    assert.match(stdout.value, /rule checks/i);
  });
});

test("CLI reports the union of rules actually applicable to scanned languages", async () => {
  await withFixture(async (directory) => {
    await writeFile(path.join(directory, "logic.ts"), "const value = 1;\n");
    await writeFile(
      path.join(directory, "view.tsx"),
      "export const View = () => <div />;\n",
    );

    const result = await checkPaths(["."], { cwd: directory });

    assert.equal(result.ruleIdsChecked.length, 19);
    assert.equal(result.diagnostics.length, 0);
  });
});

test("config controls includes, ignores, severities, packs, rules, and overrides", async () => {
  await withFixture(async (directory) => {
    await mkdir(path.join(directory, "src", "ignored"), { recursive: true });
    await mkdir(path.join(directory, "src", "strict"), { recursive: true });
    await writeFile(
      path.join(directory, "src", "warning.ts"),
      "const value: any = 1;\n",
    );
    await writeFile(
      path.join(directory, "src", "strict", "error.ts"),
      "const value: any = 1;\n",
    );
    await writeFile(
      path.join(directory, "src", "ignored", "bad.ts"),
      "const value: any = 1;\n",
    );
    await writeFile(
      path.join(directory, "outside.ts"),
      "const value: any = 1;\n",
    );
    await writeFile(
      path.join(directory, "coding-bible.config.ts"),
      `export default {
  include: ["src/**/*"],
  ignore: ["src/ignored/**"],
  packs: { typescript: "warning" },
  rules: { "TS-003": "off" },
  overrides: [
    { files: ["src/strict/**"], rules: { "TS-001": "error" } },
  ],
} satisfies Record<string, unknown>;
`,
    );

    const result = await checkPaths(["."], { cwd: directory });

    assert.equal(result.filesScanned, 2);
    assert.equal(result.findings.length, 2);
    assert.deepEqual(
      result.findings.map(({ filePath, severity }) => [filePath, severity]),
      [
        [path.join("src", "strict", "error.ts"), "error"],
        [path.join("src", "warning.ts"), "warning"],
      ],
    );
    assert.equal(result.ruleIdsChecked.includes("TS-003"), false);
  });
});

test("warning-only configuration does not fail the CLI", async () => {
  await withFixture(async (directory) => {
    await writeFile(path.join(directory, "bad.ts"), "const value: any = 1;\n");
    await writeFile(
      path.join(directory, "coding-bible.config.mjs"),
      `export default { rules: { "TS-001": "warning" } };\n`,
    );
    const stdout = createWriter();
    const stderr = createWriter();

    const exitCode = await runCli(["check", "."], {
      cwd: directory,
      stderr,
      stdout,
    });

    assert.equal(exitCode, 0);
    assert.equal(stderr.value, "");
    assert.match(stdout.value, /0 errors and 1 warning/);
  });
});

test("project scan groups files by their nearest tsconfig", async () => {
  await withFixture(async (directory) => {
    for (const packageName of ["a", "b"]) {
      const packageDirectory = path.join(directory, "packages", packageName);
      await mkdir(path.join(packageDirectory, "src"), { recursive: true });
      await writeFile(
        path.join(packageDirectory, "tsconfig.json"),
        JSON.stringify({ compilerOptions: { strict: true }, include: ["src"] }),
      );
      await writeFile(
        path.join(packageDirectory, "src", "index.ts"),
        "export const value = 1;\n",
      );
    }

    const result = await checkPaths(["packages"], { cwd: directory });

    assert.equal(result.filesScanned, 2);
    assert.deepEqual(result.tsconfigPaths, [
      path.join("packages", "a", "tsconfig.json"),
      path.join("packages", "b", "tsconfig.json"),
    ]);
    assert.equal(result.diagnostics.length, 0);
  });
});

test("--changed scans only working-tree and untracked source files", async () => {
  await withFixture(async (directory) => {
    const { execFile } = await import("node:child_process");
    const run = (args) =>
      new Promise((resolve, reject) => {
        execFile("git", args, { cwd: directory }, (error, stdout) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });

    await run(["init", "-q"]);
    await run(["config", "user.email", "test@example.com"]);
    await run(["config", "user.name", "Test"]);
    await writeFile(path.join(directory, "tracked.ts"), "const tracked = 1;\n");
    await writeFile(
      path.join(directory, "untouched.ts"),
      "const untouched = 1;\n",
    );
    await run(["add", "."]);
    await run(["commit", "-qm", "baseline"]);

    await writeFile(
      path.join(directory, "tracked.ts"),
      "const tracked: any = 1;\n",
    );
    await writeFile(path.join(directory, "new.ts"), "const added: any = 1;\n");

    const result = await checkPaths(["."], {
      cwd: directory,
      scope: { mode: "changed" },
    });

    assert.equal(result.filesScanned, 2);
    assert.deepEqual(
      result.findings.map(({ filePath }) => filePath),
      ["new.ts", "tracked.ts"],
    );
  });
});

test("--staged scans only staged source files", async () => {
  await withFixture(async (directory) => {
    const { execFile } = await import("node:child_process");
    const run = (args) =>
      new Promise((resolve, reject) => {
        execFile("git", args, { cwd: directory }, (error, stdout) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });

    await run(["init", "-q"]);
    await run(["config", "user.email", "test@example.com"]);
    await run(["config", "user.name", "Test"]);
    await writeFile(path.join(directory, "staged.ts"), "const staged = 1;\n");
    await writeFile(
      path.join(directory, "unstaged.ts"),
      "const unstaged = 1;\n",
    );
    await run(["add", "."]);
    await run(["commit", "-qm", "baseline"]);

    await writeFile(
      path.join(directory, "staged.ts"),
      "const staged: any = 1;\n",
    );
    await writeFile(
      path.join(directory, "unstaged.ts"),
      "const unstaged: any = 1;\n",
    );
    await run(["add", "staged.ts"]);

    const result = await checkPaths(["."], {
      cwd: directory,
      scope: { mode: "staged" },
    });

    assert.equal(result.filesScanned, 1);
    assert.equal(result.findings[0]?.filePath, "staged.ts");
  });
});

test("profile mode reports phase timings", async () => {
  await withFixture(async (directory) => {
    await writeFile(path.join(directory, "good.ts"), "const value = 1;\n");

    const result = await checkPaths(["."], {
      cwd: directory,
      profile: true,
    });

    assert.ok(result.profile.totalMs >= 0);
    assert.ok(result.profile.discoveryMs >= 0);
    assert.ok(result.profile.programMs >= 0);
    assert.ok(result.profile.analysisMs >= 0);
  });
});

test("--since includes committed branch changes and current worktree changes", async () => {
  await withFixture(async (directory) => {
    const { execFile } = await import("node:child_process");
    const run = (args) =>
      new Promise((resolve, reject) => {
        execFile("git", args, { cwd: directory }, (error, stdout) => {
          if (error) reject(error);
          else resolve(String(stdout).trim());
        });
      });

    await run(["init", "-q"]);
    await run(["config", "user.email", "test@example.com"]);
    await run(["config", "user.name", "Test"]);
    await writeFile(
      path.join(directory, "committed.ts"),
      "const committed = 1;\n",
    );
    await writeFile(path.join(directory, "working.ts"), "const working = 1;\n");
    await run(["add", "."]);
    await run(["commit", "-qm", "baseline"]);
    const base = await run(["rev-parse", "HEAD"]);

    await writeFile(
      path.join(directory, "committed.ts"),
      "const committed: any = 1;\n",
    );
    await run(["add", "committed.ts"]);
    await run(["commit", "-qm", "branch change"]);
    await writeFile(
      path.join(directory, "working.ts"),
      "const working: any = 1;\n",
    );

    const result = await checkPaths(["."], {
      cwd: directory,
      scope: { mode: "since", ref: base },
    });

    assert.equal(result.filesScanned, 2);
    assert.deepEqual(
      result.findings.map(({ filePath }) => filePath),
      ["committed.ts", "working.ts"],
    );
  });
});

test("config command exposes the resolved configuration", async () => {
  await withFixture(async (directory) => {
    await writeFile(
      path.join(directory, "coding-bible.config.mjs"),
      `export default { include: ["src/**/*"], rules: { "TS-001": "warning" } };\n`,
    );
    const stdout = createWriter();
    const stderr = createWriter();

    const exitCode = await runCli(["config", "--json"], {
      cwd: directory,
      stderr,
      stdout,
    });
    const config = JSON.parse(stdout.value);

    assert.equal(exitCode, 0);
    assert.equal(stderr.value, "");
    assert.deepEqual(config.include, ["src/**/*"]);
    assert.equal(config.rules["TS-001"], "warning");
    assert.ok(
      config.ignore.some((pattern) => pattern.includes("node_modules")),
    );
  });
});

test("invalid config fails as a tool error with exit code 2", async () => {
  await withFixture(async (directory) => {
    await writeFile(path.join(directory, "good.ts"), "const value = 1;\n");
    await writeFile(
      path.join(directory, "coding-bible.config.mjs"),
      `export default { packs: { react: "sometimes" } };\n`,
    );
    const stdout = createWriter();
    const stderr = createWriter();

    const exitCode = await runCli(["check", "."], {
      cwd: directory,
      stderr,
      stdout,
    });

    assert.equal(exitCode, 2);
    assert.equal(stdout.value, "");
    assert.match(stderr.value, /must be "error", "warning", or "off"/);
  });
});

test("config discovery walks upward and treats the config directory as project root", async () => {
  await withFixture(async (directory) => {
    await mkdir(path.join(directory, "apps", "web", "src"), {
      recursive: true,
    });
    await writeFile(
      path.join(directory, "coding-bible.config.mjs"),
      `export default { include: ["apps/**/*"], rules: { "TS-001": "warning" } };\n`,
    );
    await writeFile(
      path.join(directory, "apps", "web", "src", "bad.ts"),
      "const value: any = 1;\n",
    );

    const result = await checkPaths([], {
      cwd: path.join(directory, "apps", "web"),
    });

    assert.equal(result.filesScanned, 1);
    assert.equal(
      result.findings[0]?.filePath,
      path.join("apps", "web", "src", "bad.ts"),
    );
    assert.equal(result.findings[0]?.severity, "warning");
    assert.equal(result.configPath, "coding-bible.config.mjs");
  });
});

test("project scan can be cancelled", async () => {
  await withFixture(async (directory) => {
    await writeFile(path.join(directory, "good.ts"), "const value = 1;\n");
    const controller = new AbortController();
    controller.abort();

    await assert.rejects(
      checkPaths(["."], { cwd: directory, signal: controller.signal }),
      /aborted/i,
    );
  });
});

test("diff scope reports changed files while retaining their full tsconfig project context", async () => {
  await withFixture(async (directory) => {
    const { execFile } = await import("node:child_process");
    const run = (args) =>
      new Promise((resolve, reject) => {
        execFile("git", args, { cwd: directory }, (error, stdout) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });

    await mkdir(path.join(directory, "src"), { recursive: true });
    await writeFile(
      path.join(directory, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: true }, include: ["src"] }),
    );
    await writeFile(
      path.join(directory, "src", "changed.ts"),
      "export const changed = 1;\n",
    );
    await writeFile(
      path.join(directory, "src", "context.ts"),
      "export const context = 1;\n",
    );
    await run(["init", "-q"]);
    await run(["config", "user.email", "test@example.com"]);
    await run(["config", "user.name", "Test"]);
    await run(["add", "."]);
    await run(["commit", "-qm", "baseline"]);

    await writeFile(
      path.join(directory, "src", "changed.ts"),
      "export const changed: any = 1;\n",
    );

    const result = await checkPaths(["src"], {
      cwd: directory,
      scope: { mode: "changed" },
    });

    assert.equal(result.filesScanned, 1);
    assert.equal(result.projectFiles, 2);
    assert.equal(result.findings[0]?.filePath, path.join("src", "changed.ts"));
  });
});

test("--changed works before the repository has its first commit", async () => {
  await withFixture(async (directory) => {
    const { execFile } = await import("node:child_process");
    const run = (args) =>
      new Promise((resolve, reject) => {
        execFile("git", args, { cwd: directory }, (error, stdout) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });

    await run(["init", "-q"]);
    await writeFile(
      path.join(directory, "staged.ts"),
      "const staged: any = 1;\n",
    );
    await writeFile(
      path.join(directory, "untracked.ts"),
      "const untracked: any = 1;\n",
    );
    await run(["add", "staged.ts"]);

    const result = await checkPaths(["."], {
      cwd: directory,
      scope: { mode: "changed" },
    });

    assert.equal(result.filesScanned, 2);
    assert.deepEqual(
      result.findings.map(({ filePath }) => filePath),
      ["staged.ts", "untracked.ts"],
    );
  });
});

test("config rejects unknown keys instead of silently ignoring typos", async () => {
  await withFixture(async (directory) => {
    await writeFile(path.join(directory, "good.ts"), "const value = 1;\n");
    await writeFile(
      path.join(directory, "coding-bible.config.mjs"),
      `export default { ignores: ["dist/**"] };\n`,
    );
    const stdout = createWriter();
    const stderr = createWriter();

    const exitCode = await runCli(["check", "."], {
      cwd: directory,
      stderr,
      stdout,
    });

    assert.equal(exitCode, 2);
    assert.match(stderr.value, /Unknown Coding Bible config option "ignores"/);
  });
});
