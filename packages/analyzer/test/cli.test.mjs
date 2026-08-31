import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
    await mkdir(path.join(directory, "public", "static", "legacy"), {
      recursive: true,
    });
    await mkdir(path.join(directory, "vendor", "dependency"), {
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
    await writeFile(
      path.join(directory, "public", "static", "legacy", "jquery.js"),
      "const value: any = 1;\n",
    );
    await writeFile(
      path.join(directory, "vendor", "dependency", "bad.ts"),
      "const value: any = 1;\n",
    );
    await writeFile(
      path.join(directory, "src", "compiled.min.js"),
      "const value = parseInt(raw);\n",
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
    assert.equal(result.ruleIdsChecked.length, 13);
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
    assert.equal(result.summary.rulesChecked, 13);
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
    assert.match(stdout.value, /13 applicable automated rules/);
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

    assert.equal(result.ruleIdsChecked.length, 21);
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

test("config rejects unknown automated rule IDs", async () => {
  await withFixture(async (directory) => {
    await writeFile(path.join(directory, "good.ts"), "const value = 1;\n");
    await writeFile(
      path.join(directory, "coding-bible.config.mjs"),
      `export default { rules: { "TS-999": "off" } };\n`,
    );
    const stdout = createWriter();
    const stderr = createWriter();

    const exitCode = await runCli(["check", "."], {
      cwd: directory,
      stderr,
      stdout,
    });

    assert.equal(exitCode, 2);
    assert.match(
      stderr.value,
      /rules contains unknown automated rule "TS-999"/,
    );
  });
});

test("JSON output uses the versioned report schema with stable finding fingerprints", async () => {
  await withFixture(async (directory) => {
    const filePath = path.join(directory, "bad.ts");
    await writeFile(filePath, "const value: any = 1;\n");
    const stdout = createWriter();
    const stderr = createWriter();

    const firstExitCode = await runCli(["check", ".", "--json"], {
      cwd: directory,
      stderr,
      stdout,
    });
    const first = JSON.parse(stdout.value);

    assert.equal(firstExitCode, 1);
    assert.equal(first.schemaVersion, 1);
    assert.equal(first.summary.findings, 1);
    assert.equal(first.findings[0].ruleId, "TS-001");
    assert.match(first.findings[0].fingerprint, /^[a-f0-9]{24}$/);
    assert.equal(
      first.findings[0].ruleUrl,
      "https://xanhast-pf.github.io/coding-bible/#TS-001",
    );
    assert.deepEqual(first.findings[0].fix, {
      available: false,
      safety: "none",
    });

    await writeFile(filePath, "// moved down\nconst value: any = 1;\n");
    const secondStdout = createWriter();
    await runCli(["check", ".", "--json"], {
      cwd: directory,
      stderr: createWriter(),
      stdout: secondStdout,
    });
    const second = JSON.parse(secondStdout.value);

    assert.equal(second.findings[0].location.line, 2);
    assert.equal(second.findings[0].fingerprint, first.findings[0].fingerprint);
  });
});

test("report and patch export separate safe fixes from review-required fixes", async () => {
  await withFixture(async (directory) => {
    const { execFile } = await import("node:child_process");
    const runGit = (args) =>
      new Promise((resolve, reject) => {
        execFile("git", args, { cwd: directory }, (error, stdout, stderr) => {
          if (error) reject(new Error(stderr || error.message));
          else resolve(stdout);
        });
      });

    await runGit(["init", "-q"]);
    await mkdir(path.join(directory, "src"), { recursive: true });
    await writeFile(
      path.join(directory, "src", "types.ts"),
      "export type User = { id: string };\n",
    );
    await writeFile(
      path.join(directory, "src", "example.ts"),
      `import { User } from "./types";\n\nexport function inspect(items: number[]): User | null {\n  const parsed = parseInt("42", 10);\n  const invalid = isNaN(parsed);\n  const sorted = items.sort((a, b) => a - b);\n  return invalid || sorted.length === 0 ? null : { id: String(parsed) };\n}\n`,
    );

    const stdout = createWriter();
    const stderr = createWriter();
    const exitCode = await runCli(
      [
        "check",
        "src",
        "--report",
        "--patch",
        "--include-review-fixes",
        "--output-dir",
        "artifacts",
      ],
      { cwd: directory, stderr, stdout },
    );

    assert.equal(exitCode, 1);
    assert.equal(stderr.value, "");
    assert.match(stdout.value, /artifacts[/\\]report\.json/);
    assert.match(stdout.value, /artifacts[/\\]safe-fixes\.patch/);
    assert.match(stdout.value, /artifacts[/\\]review-fixes\.patch/);

    const report = JSON.parse(
      await readFile(path.join(directory, "artifacts", "report.json"), "utf8"),
    );
    assert.equal(report.schemaVersion, 1);
    assert.equal(report.summary.safeFixes, 2);
    assert.equal(report.summary.reviewFixes, 2);
    assert.equal(
      report.findings.find(({ ruleId }) => ruleId === "TS-003")?.fix.safety,
      "safe",
    );

    const safePatch = await readFile(
      path.join(directory, "artifacts", "safe-fixes.patch"),
      "utf8",
    );
    const reviewPatch = await readFile(
      path.join(directory, "artifacts", "review-fixes.patch"),
      "utf8",
    );
    assert.match(safePatch, /\+import \{ type User \}/);
    assert.match(safePatch, /Number\.parseInt/);
    assert.doesNotMatch(safePatch, /Number\.isNaN/);
    assert.match(reviewPatch, /Number\.isNaN/);
    assert.match(reviewPatch, /toSorted/);

    await runGit([
      "apply",
      "--check",
      path.join("artifacts", "safe-fixes.patch"),
    ]);
    await runGit([
      "apply",
      "--check",
      path.join("artifacts", "review-fixes.patch"),
    ]);
    await runGit(["apply", path.join("artifacts", "safe-fixes.patch")]);
    const fixed = await readFile(
      path.join(directory, "src", "example.ts"),
      "utf8",
    );
    assert.match(fixed, /import \{ type User \}/);
    assert.match(fixed, /Number\.parseInt/);
  });
});

test("review fix export requires patch export", async () => {
  const stdout = createWriter();
  const stderr = createWriter();
  const exitCode = await runCli(["check", ".", "--include-review-fixes"], {
    cwd: process.cwd(),
    stderr,
    stdout,
  });

  assert.equal(exitCode, 2);
  assert.match(stderr.value, /requires --patch/);
});

test("project cache skips Program construction on an unchanged warm scan", async () => {
  await withFixture(async (directory) => {
    await mkdir(path.join(directory, "src"), { recursive: true });
    await writeFile(
      path.join(directory, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: true }, include: ["src"] }),
    );
    await writeFile(
      path.join(directory, "src", "index.ts"),
      "export const value: any = 1;\n",
    );

    const first = await checkPaths(["src"], { cwd: directory, profile: true });
    const second = await checkPaths(["src"], { cwd: directory, profile: true });

    assert.equal(first.cache.hits, 0);
    assert.equal(first.cache.misses, 1);
    assert.equal(second.cache.hits, 1);
    assert.equal(second.cache.misses, 0);
    assert.equal(second.profile.programMs, 0);
    assert.equal(second.findings[0]?.ruleId, "TS-001");
  });
});

test("concurrent project scans do not race cache temp files", async () => {
  await withFixture(async (directory) => {
    await mkdir(path.join(directory, "src"), { recursive: true });
    await writeFile(
      path.join(directory, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: true }, include: ["src"] }),
    );
    await Promise.all(
      Array.from({ length: 24 }, (_, index) =>
        writeFile(
          path.join(directory, "src", `module-${index}.ts`),
          `export const value${index}: any = ${index};\n`,
        ),
      ),
    );

    const [left, right] = await Promise.all([
      checkPaths(["src"], { cwd: directory }),
      checkPaths(["src"], { cwd: directory }),
    ]);

    assert.equal(left.findings.length, 24);
    assert.equal(right.findings.length, 24);

    const warm = await checkPaths(["src"], { cwd: directory, profile: true });
    assert.equal(warm.cache.hits, 24);
    assert.equal(warm.cache.misses, 0);
    assert.equal(warm.profile.programMs, 0);
  });
});

test("source-file cache survives an unrelated sibling edit", async () => {
  await withFixture(async (directory) => {
    await mkdir(path.join(directory, "src"), { recursive: true });
    await writeFile(
      path.join(directory, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: true }, include: ["src"] }),
    );
    await writeFile(
      path.join(directory, "src", "target.ts"),
      "export const target: any = 1;\n",
    );
    const sibling = path.join(directory, "src", "sibling.ts");
    await writeFile(sibling, "export const sibling = 1;\n");

    await checkPaths([path.join("src", "target.ts")], {
      cwd: directory,
      profile: true,
    });
    const warm = await checkPaths([path.join("src", "target.ts")], {
      cwd: directory,
      profile: true,
    });
    assert.equal(warm.cache.hits, 1);

    await writeFile(sibling, "export const sibling = 2;\n");
    const invalidated = await checkPaths([path.join("src", "target.ts")], {
      cwd: directory,
      profile: true,
    });

    assert.equal(invalidated.cache.hits, 1);
    assert.equal(invalidated.cache.misses, 0);
    assert.equal(invalidated.profile.programMs, 0);
  });
});

test("one-file edits reuse unaffected source-file cache entries", async () => {
  await withFixture(async (directory) => {
    await mkdir(path.join(directory, "src"), { recursive: true });
    await writeFile(
      path.join(directory, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: true }, include: ["src"] }),
    );
    const changedPath = path.join(directory, "src", "changed.ts");
    await writeFile(changedPath, "export const changed: any = 1;\n");
    await writeFile(
      path.join(directory, "src", "stable.ts"),
      "export const stable: any = 1;\n",
    );

    await checkPaths(["src"], { cwd: directory, profile: true });
    const warm = await checkPaths(["src"], { cwd: directory, profile: true });
    assert.equal(warm.cache.hits, 2);

    await writeFile(changedPath, "export const changed: unknown = 1;\n");
    const incremental = await checkPaths(["src"], {
      cwd: directory,
      profile: true,
    });

    assert.equal(incremental.cache.hits, 1);
    assert.equal(incremental.cache.misses, 1);
    assert.equal(incremental.profile.sourceCacheHits, 1);
    assert.equal(incremental.profile.sourceCacheMisses, 1);
    assert.equal(incremental.findings.length, 1);
    assert.equal(
      incremental.findings[0]?.filePath,
      path.join("src", "stable.ts"),
    );
  });
});

test("targeted scans preserve warm cache entries for unselected files", async () => {
  await withFixture(async (directory) => {
    await mkdir(path.join(directory, "src"), { recursive: true });
    await writeFile(
      path.join(directory, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: true }, include: ["src"] }),
    );
    const targetPath = path.join(directory, "src", "target.ts");
    await writeFile(targetPath, "export const target: any = 1;\n");
    await writeFile(
      path.join(directory, "src", "stable.ts"),
      "export const stable: any = 1;\n",
    );

    await checkPaths(["src"], { cwd: directory });
    const warm = await checkPaths(["src"], { cwd: directory, profile: true });
    assert.equal(warm.cache.hits, 2);

    await writeFile(targetPath, "export const target: unknown = 1;\n");
    const targeted = await checkPaths([path.join("src", "target.ts")], {
      cwd: directory,
      profile: true,
    });
    assert.equal(targeted.cache.hits, 0);
    assert.equal(targeted.cache.misses, 1);

    const full = await checkPaths(["src"], { cwd: directory, profile: true });
    assert.equal(full.cache.hits, 2);
    assert.equal(full.cache.misses, 0);
    assert.equal(full.profile.programMs, 0);
  });
});

test("CLI rule selection supports allowlists and exclusions", async () => {
  await withFixture(async (directory) => {
    await writeFile(
      path.join(directory, "bad.ts"),
      "const value: any = 1;\nconst page = parseInt(raw);\n",
    );

    const onlyTypes = createWriter();
    const onlyTypesExit = await runCli(["check", ".", "--rules", "TS-001"], {
      cwd: directory,
      stderr: createWriter(),
      stdout: onlyTypes,
    });
    assert.equal(onlyTypesExit, 1);
    assert.match(onlyTypes.value, /TS-001/);
    assert.doesNotMatch(onlyTypes.value, /JS-004/);

    const excludedTypes = createWriter();
    const excludedExit = await runCli(
      ["check", ".", "--exclude-rules", "TS-001"],
      { cwd: directory, stderr: createWriter(), stdout: excludedTypes },
    );
    assert.equal(excludedExit, 1);
    assert.doesNotMatch(excludedTypes.value, /TS-001/);
    assert.match(excludedTypes.value, /JS-004/);
  });
});

test("CLI rule selection rejects unknown automated rule IDs", async () => {
  await withFixture(async (directory) => {
    await writeFile(
      path.join(directory, "good.ts"),
      "export const value = 1;\n",
    );
    const stderr = createWriter();
    const exitCode = await runCli(["check", ".", "--rules", "TS-999"], {
      cwd: directory,
      stderr,
      stdout: createWriter(),
    });

    assert.equal(exitCode, 2);
    assert.match(stderr.value, /unknown automated rule "TS-999"/i);
  });
});

test("--no-cache bypasses cached analyzer results", async () => {
  await withFixture(async (directory) => {
    await writeFile(path.join(directory, "bad.ts"), "const value: any = 1;\n");
    await checkPaths(["."], { cwd: directory, profile: true });
    const stdout = createWriter();
    const stderr = createWriter();

    const exitCode = await runCli(["check", ".", "--no-cache", "--profile"], {
      cwd: directory,
      stderr,
      stdout,
    });

    assert.equal(exitCode, 1);
    assert.equal(stderr.value, "");
    assert.match(stdout.value, /0 hits, 0 misses/);
  });
});

test("baseline creation suppresses known findings but --no-baseline reveals them", async () => {
  await withFixture(async (directory) => {
    const filePath = path.join(directory, "bad.ts");
    await writeFile(filePath, "const value: any = 1;\n");
    const baselineStdout = createWriter();

    const baselineExitCode = await runCli(["baseline", "create", "."], {
      cwd: directory,
      stderr: createWriter(),
      stdout: baselineStdout,
    });

    assert.equal(baselineExitCode, 0);
    assert.match(baselineStdout.value, /baseline with 1 finding/);
    const baseline = JSON.parse(
      await readFile(
        path.join(directory, ".coding-bible-baseline.json"),
        "utf8",
      ),
    );
    assert.equal(baseline.schemaVersion, 1);
    assert.equal(baseline.findings.length, 1);
    assert.match(baseline.findings[0].fingerprint, /^[a-f0-9]{24}$/);

    const cleanStdout = createWriter();
    const cleanExitCode = await runCli(["check", "."], {
      cwd: directory,
      stderr: createWriter(),
      stdout: cleanStdout,
    });
    assert.equal(cleanExitCode, 0);
    assert.match(cleanStdout.value, /1 known baseline finding was suppressed/);

    const rawStdout = createWriter();
    const rawExitCode = await runCli(["check", ".", "--no-baseline"], {
      cwd: directory,
      stderr: createWriter(),
      stdout: rawStdout,
    });
    assert.equal(rawExitCode, 1);
    assert.match(rawStdout.value, /TS-001/);
  });
});

test("baseline fingerprints survive line movement but expose changed violations", async () => {
  await withFixture(async (directory) => {
    const filePath = path.join(directory, "bad.ts");
    await writeFile(filePath, "const value: any = 1;\n");
    await runCli(["baseline", "create", "."], {
      cwd: directory,
      stderr: createWriter(),
      stdout: createWriter(),
    });

    await writeFile(filePath, "// unrelated line\nconst value: any = 1;\n");
    const moved = await checkPaths(["."], { cwd: directory });
    assert.equal(moved.findings.length, 0);
    assert.equal(moved.baseline?.suppressed, 1);

    await writeFile(filePath, "// unrelated line\nconst changed: any = 1;\n");
    const changed = await checkPaths(["."], { cwd: directory });
    assert.equal(changed.findings.length, 1);
    assert.equal(changed.findings[0]?.ruleId, "TS-001");
    assert.equal(changed.baseline?.suppressed, 0);
  });
});

test("baseline never hides malformed source diagnostics", async () => {
  await withFixture(async (directory) => {
    await writeFile(path.join(directory, "bad.ts"), "const value: any = 1;\n");
    await runCli(["baseline", "create", "."], {
      cwd: directory,
      stderr: createWriter(),
      stdout: createWriter(),
    });
    await writeFile(path.join(directory, "bad.ts"), "const value = ;\n");

    const result = await checkPaths(["."], { cwd: directory });

    assert.equal(result.findings.length, 0);
    assert.equal(result.diagnostics.length, 1);
  });
});

test("project cache invalidates when analyzer configuration changes", async () => {
  await withFixture(async (directory) => {
    await writeFile(path.join(directory, "bad.ts"), "const value: any = 1;\n");

    const first = await checkPaths(["."], { cwd: directory, profile: true });
    const warm = await checkPaths(["."], { cwd: directory, profile: true });
    assert.equal(first.findings.length, 1);
    assert.equal(warm.cache.hits, 1);

    await writeFile(
      path.join(directory, "coding-bible.config.mjs"),
      'export default { rules: { "TS-001": "off" } };\n',
    );
    const changed = await checkPaths(["."], { cwd: directory, profile: true });

    assert.equal(changed.cache.hits, 0);
    assert.ok(changed.cache.misses > 0);
    assert.equal(changed.findings.length, 0);
    assert.equal(changed.ruleIdsChecked.includes("TS-001"), false);
  });
});

test("--clear-cache removes warm results before analysis", async () => {
  await withFixture(async (directory) => {
    await writeFile(path.join(directory, "bad.ts"), "const value: any = 1;\n");
    await checkPaths(["."], { cwd: directory, profile: true });
    const stdout = createWriter();
    const stderr = createWriter();

    const exitCode = await runCli(
      ["check", ".", "--clear-cache", "--profile"],
      {
        cwd: directory,
        stderr,
        stdout,
      },
    );

    assert.equal(exitCode, 1);
    assert.equal(stderr.value, "");
    assert.match(stdout.value, /0 hits, 1 misses/);
  });
});

test("config validates custom cache and baseline settings", async () => {
  await withFixture(async (directory) => {
    await writeFile(path.join(directory, "good.ts"), "const value = 1;\n");
    await writeFile(
      path.join(directory, "coding-bible.config.mjs"),
      `export default {
  cache: ".cache/coding-bible",
  baseline: "config/bible-baseline.json",
};\n`,
    );

    const stdout = createWriter();
    const exitCode = await runCli(["config", "--json"], {
      cwd: directory,
      stderr: createWriter(),
      stdout,
    });
    const config = JSON.parse(stdout.value);

    assert.equal(exitCode, 0);
    assert.equal(config.cache, ".cache/coding-bible");
    assert.equal(config.baseline, "config/bible-baseline.json");
  });
});
