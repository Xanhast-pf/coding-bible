import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
const actionDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(actionDirectory, "../..");
const committedDist = path.join(actionDirectory, "dist");
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

const relativeImport = (fromFile, toFile) => {
  let relative = path
    .relative(path.dirname(fromFile), toFile)
    .replaceAll("\\", "/");
  if (!relative.startsWith(".")) {
    relative = `./${relative}`;
  }
  return relative;
};

const rewriteRuntimeImports = (source, outputFile, typescriptPath) =>
  source
    .replaceAll(
      'from "typescript"',
      `from "${relativeImport(outputFile, typescriptPath)}"`,
    )
    .replaceAll(/(from\s+["'][^"']+)\.ts(["'])/gu, "$1.mjs$2")
    .replaceAll(/(import\s*\(\s*["'][^"']+)\.ts(["']\s*\))/gu, "$1.mjs$2");

const transpileAnalyzerSource = async (
  sourceDirectory,
  outputDirectory,
  typescriptPath,
) => {
  for (const relativeFile of await walkFiles(sourceDirectory)) {
    if (!relativeFile.endsWith(".ts")) {
      continue;
    }
    const sourcePath = path.join(sourceDirectory, relativeFile);
    const outputPath = path.join(
      outputDirectory,
      relativeFile.replace(/\.ts$/u, ".mjs"),
    );
    await mkdir(path.dirname(outputPath), { recursive: true });
    const transpiled = ts.transpileModule(await readFile(sourcePath, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        verbatimModuleSyntax: true,
      },
      fileName: sourcePath,
    }).outputText;
    await writeFile(
      outputPath,
      rewriteRuntimeImports(transpiled, outputPath, typescriptPath),
      "utf8",
    );
  }
};

const copyAnalyzerCli = async (
  sourceDirectory,
  outputDirectory,
  typescriptPath,
) => {
  await mkdir(outputDirectory, { recursive: true });
  for (const relativeFile of await walkFiles(sourceDirectory)) {
    if (!relativeFile.endsWith(".mjs")) {
      continue;
    }
    const outputPath = path.join(outputDirectory, relativeFile);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      rewriteRuntimeImports(
        await readFile(path.join(sourceDirectory, relativeFile), "utf8"),
        outputPath,
        typescriptPath,
      ),
      "utf8",
    );
  }
};

const createBuild = async (outputDirectory) => {
  await mkdir(outputDirectory, { recursive: true });
  await cp(path.join(actionDirectory, "src"), outputDirectory, {
    recursive: true,
  });

  const bridgePath = path.join(outputDirectory, "analyzerBridge.mjs");
  await writeFile(
    bridgePath,
    (await readFile(bridgePath, "utf8")).replace(
      '"../../analyzer/cli/check.mjs"',
      '"./vendor/analyzer/cli/check.mjs"',
    ),
    "utf8",
  );

  const catalogPath = path.join(outputDirectory, "ruleCatalog.mjs");
  await writeFile(
    catalogPath,
    (await readFile(catalogPath, "utf8")).replace(
      '"../../../apps/web/public/rules.json"',
      '"./rules.json"',
    ),
    "utf8",
  );

  const typescriptSource = require.resolve("typescript");
  const typescriptDestination = path.join(
    outputDirectory,
    "vendor",
    "typescript",
    "typescript.cjs",
  );
  await mkdir(path.dirname(typescriptDestination), { recursive: true });
  await cp(typescriptSource, typescriptDestination);

  const analyzerDestination = path.join(outputDirectory, "vendor", "analyzer");
  await copyAnalyzerCli(
    path.join(repositoryRoot, "packages", "analyzer", "cli"),
    path.join(analyzerDestination, "cli"),
    typescriptDestination,
  );
  await transpileAnalyzerSource(
    path.join(repositoryRoot, "packages", "analyzer", "src"),
    path.join(analyzerDestination, "src"),
    typescriptDestination,
  );

  await cp(
    path.join(repositoryRoot, "apps", "web", "public", "rules.json"),
    path.join(outputDirectory, "rules.json"),
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
  path.join(buildCacheDirectory, "coding-bible-action-"),
);
const generatedDist = path.join(temporaryRoot, "dist");

try {
  await createBuild(generatedDist);

  if (checkMode) {
    const stale = await compareBuild(generatedDist, committedDist);
    if (stale.length) {
      process.stderr.write(
        `GitHub Action runtime is stale: ${stale.join(", ")}\nRun \`pnpm action:build\` and commit packages/action/dist.\n`,
      );
      process.exitCode = 1;
    } else {
      process.stdout.write("GitHub Action runtime is current.\n");
    }
  } else {
    await rm(committedDist, { recursive: true, force: true });
    await rename(generatedDist, committedDist);
    process.stdout.write("Generated self-contained GitHub Action runtime.\n");
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
