import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const packageDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(packageDirectory, "../..");
const committedDist = path.join(packageDirectory, "dist");
const checkMode = process.argv.includes("--check");

const walkFiles = async (directory, root = directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(absolute, root)));
    } else {
      files.push(path.relative(root, absolute).replaceAll("\\", "/"));
    }
  }
  return files.sort();
};

const sha256 = async (filePath) =>
  createHash("sha256")
    .update(await readFile(filePath))
    .digest("hex");

const runTsc = async (outDir) => {
  const tscPath = require.resolve("typescript/bin/tsc");
  const args = [
    tscPath,
    "-p",
    path.join(packageDirectory, "tsconfig.build.json"),
    "--outDir",
    outDir,
  ];
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: repositoryRoot,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`TypeScript build terminated by ${signal}.`));
      } else if (code !== 0) {
        reject(new Error(`TypeScript build failed with exit code ${code}.`));
      } else {
        resolve();
      }
    });
  });
};

const rewriteRuntimeImports = (source) =>
  source.replaceAll(/(from\s+["']\.\.\/src\/[^"']+)\.ts(["'])/gu, "$1.js$2");

const copyRuntimeDirectory = async (sourceDirectory, outputDirectory) => {
  for (const relativeFile of await walkFiles(sourceDirectory)) {
    const sourcePath = path.join(sourceDirectory, relativeFile);
    const outputPath = path.join(outputDirectory, relativeFile);
    await mkdir(path.dirname(outputPath), { recursive: true });
    const contents = await readFile(sourcePath, "utf8");
    await writeFile(outputPath, rewriteRuntimeImports(contents), "utf8");
  }
};

const createBuild = async (outputDirectory) => {
  const sourceOutput = path.join(outputDirectory, "src");
  await mkdir(outputDirectory, { recursive: true });
  await runTsc(sourceOutput);
  for (const relativeFile of await walkFiles(sourceOutput)) {
    if (!relativeFile.endsWith(".d.ts")) {
      continue;
    }
    const declarationPath = path.join(sourceOutput, relativeFile);
    const declaration = await readFile(declarationPath, "utf8");
    await writeFile(
      declarationPath,
      declaration.replaceAll(
        /(["'])(\.{1,2}\/[^"']+)\.ts\1/gu,
        (_match, quote, specifier) => `${quote}${specifier}.js${quote}`,
      ),
      "utf8",
    );
  }
  await copyRuntimeDirectory(
    path.join(packageDirectory, "cli"),
    path.join(outputDirectory, "cli"),
  );
  await copyRuntimeDirectory(
    path.join(packageDirectory, "bin"),
    path.join(outputDirectory, "bin"),
  );
};

const compareBuild = async (expectedDirectory, actualDirectory) => {
  const expectedFiles = await walkFiles(expectedDirectory);
  let actualFiles;
  try {
    actualFiles = await walkFiles(actualDirectory);
  } catch {
    actualFiles = [];
  }
  const allFiles = [...new Set([...expectedFiles, ...actualFiles])].sort();
  const stale = [];

  for (const relativeFile of allFiles) {
    if (
      !expectedFiles.includes(relativeFile) ||
      !actualFiles.includes(relativeFile)
    ) {
      stale.push(relativeFile);
      continue;
    }
    const [expectedHash, actualHash] = await Promise.all([
      sha256(path.join(expectedDirectory, relativeFile)),
      sha256(path.join(actualDirectory, relativeFile)),
    ]);
    if (expectedHash !== actualHash) {
      stale.push(relativeFile);
    }
  }
  return stale;
};

const buildCacheDirectory = path.join(repositoryRoot, ".cache");
await mkdir(buildCacheDirectory, { recursive: true });
const temporaryRoot = await mkdtemp(
  path.join(buildCacheDirectory, "coding-bible-analyzer-package-"),
);
const generatedDist = path.join(temporaryRoot, "dist");

try {
  await createBuild(generatedDist);

  if (checkMode) {
    const stale = await compareBuild(generatedDist, committedDist);
    if (stale.length) {
      process.stderr.write(
        `Analyzer package runtime is stale: ${stale.join(", ")}\nRun \`pnpm analyzer:build\` and commit packages/analyzer/dist.\n`,
      );
      process.exitCode = 1;
    } else {
      process.stdout.write("Analyzer package runtime is current.\n");
    }
  } else {
    await rm(committedDist, { recursive: true, force: true });
    await rename(generatedDist, committedDist);
    process.stdout.write(
      "Generated consumer-ready analyzer package runtime.\n",
    );
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
