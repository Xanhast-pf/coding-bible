import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const packageDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const runNode = (args, cwd) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd,
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      resolve({ code, signal, stderr, stdout });
    });
  });

const linkDirectory = async (target, linkPath) => {
  await symlink(
    target,
    linkPath,
    process.platform === "win32" ? "junction" : "dir",
  );
};

test("consumer package executes compiled runtime from node_modules", async () => {
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-analyzer-consumer-"),
  );

  try {
    const consumerDirectory = path.join(temporaryRoot, "consumer");
    const installedPackage = path.join(
      consumerDirectory,
      "node_modules",
      "@coding-bible",
      "analyzer",
    );
    await mkdir(installedPackage, { recursive: true });
    await cp(
      path.join(packageDirectory, "dist"),
      path.join(installedPackage, "dist"),
      { recursive: true },
    );
    await cp(
      path.join(packageDirectory, "package.json"),
      path.join(installedPackage, "package.json"),
    );

    const typescriptPackageJson = require.resolve("typescript/package.json");
    const typescriptDirectory = await realpath(
      path.dirname(typescriptPackageJson),
    );
    await mkdir(path.join(consumerDirectory, "node_modules"), {
      recursive: true,
    });
    await linkDirectory(
      typescriptDirectory,
      path.join(consumerDirectory, "node_modules", "typescript"),
    );

    await writeFile(
      path.join(consumerDirectory, "package.json"),
      `${JSON.stringify({ name: "consumer", private: true, type: "module" }, null, 2)}\n`,
      "utf8",
    );
    await mkdir(path.join(consumerDirectory, "src"), { recursive: true });
    await writeFile(
      path.join(consumerDirectory, "src", "example.ts"),
      "let value = 1;\nconsole.log(value);\n",
      "utf8",
    );

    const apiProbe = await runNode(
      [
        "--input-type=module",
        "--eval",
        [
          'import { analyze } from "@coding-bible/analyzer";',
          'const result = analyze({ language: "ts", source: "let value = 1;" });',
          [
            'if (!result.findings.some((finding) => finding.ruleId === "CORE-003"))',
            "  process.exit(3);",
          ].join("\n"),
        ].join("\n"),
      ],
      consumerDirectory,
    );
    assert.equal(apiProbe.code, 0, apiProbe.stderr || apiProbe.stdout);
    assert.doesNotMatch(
      apiProbe.stderr,
      /ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING/u,
    );

    const cliProbe = await runNode(
      [
        path.join(installedPackage, "dist", "bin", "coding-bible.mjs"),
        "check",
        "src",
        "--json",
        "--no-cache",
        "--no-baseline",
      ],
      consumerDirectory,
    );
    assert.equal(cliProbe.code, 1, cliProbe.stderr || cliProbe.stdout);
    assert.equal(cliProbe.signal, null);
    assert.doesNotMatch(
      cliProbe.stderr,
      /ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING/u,
    );
    const report = JSON.parse(cliProbe.stdout);
    assert.ok(report.summary.filesAnalyzed > 0);
    assert.ok(report.summary.rulesChecked > 0);
    assert.ok(report.findings.some((finding) => finding.ruleId === "CORE-003"));

    const manifest = JSON.parse(
      await readFile(path.join(installedPackage, "package.json"), "utf8"),
    );
    assert.equal(manifest.exports["."].import, "./dist/src/index.js");
    assert.equal(manifest.bin["coding-bible"], "./dist/bin/coding-bible.mjs");
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
});
