import { createHash, randomUUID } from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "../../typescript/typescript.cjs";

const cacheSchemaVersion = 2;
const analyzerRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const exists = async (filePath) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const normalizePath = (value) => value.replaceAll("\\", "/");

const stableValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  return value;
};

const stableStringify = (value) => JSON.stringify(stableValue(value));

const hashReadConcurrency = 32;

const readHashInput = async (filePath, rootDir, signal) => {
  signal?.throwIfAborted();
  let contents;
  try {
    contents = await readFile(filePath, signal ? { signal } : undefined);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      contents = "<missing>";
    } else {
      throw error;
    }
  }

  return {
    contents,
    relativePath: normalizePath(path.relative(rootDir, filePath)),
  };
};

const updateHashWithInput = (hash, input) => {
  hash.update(input.relativePath);
  hash.update("\0");
  hash.update(input.contents);
  hash.update("\0");
};

const readHashInputs = async (filePaths, rootDir, signal) => {
  const inputs = Array(filePaths.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < filePaths.length) {
      signal?.throwIfAborted();
      const index = nextIndex;
      nextIndex += 1;
      const filePath = filePaths[index];
      if (filePath) {
        inputs[index] = await readHashInput(filePath, rootDir, signal);
      }
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(hashReadConcurrency, filePaths.length) },
      worker,
    ),
  );
  return inputs;
};

const updateFileHash = async (hash, filePath, rootDir, signal) => {
  updateHashWithInput(hash, await readHashInput(filePath, rootDir, signal));
};

let implementationSignaturePromise;
const getImplementationSignature = () => {
  implementationSignaturePromise ??= (async () => {
    const sourceRoot = path.join(analyzerRoot, "src");
    const sourceFiles = (await readdir(sourceRoot, { recursive: true }))
      .filter((entry) => entry.endsWith(".ts"))
      .map((entry) => path.join(sourceRoot, entry));
    const files = [
      ...sourceFiles,
      path.join(analyzerRoot, "cli", "config.mjs"),
      path.join(analyzerRoot, "cli", "project.mjs"),
    ].sort((left, right) => left.localeCompare(right));
    const hash = createHash("sha256");
    for (const filePath of files) {
      await updateFileHash(hash, filePath, analyzerRoot);
    }
    return hash.digest("hex");
  })();
  return implementationSignaturePromise;
};

const isInside = (parent, candidate) => {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

const findNearestPackageJson = async (startDirectory, rootDir) => {
  let directory = startDirectory;
  while (isInside(rootDir, directory)) {
    const candidate = path.join(directory, "package.json");
    if (await exists(candidate)) {
      return candidate;
    }
    if (directory === rootDir) {
      return null;
    }
    const parent = path.dirname(directory);
    if (parent === directory) {
      return null;
    }
    directory = parent;
  }
  return null;
};

const getDependencyMetadataFiles = async (rootDir, projectDirectory) => {
  const lockFileNames = [
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    "bun.lock",
    "bun.lockb",
  ];
  const candidates = [
    path.join(rootDir, "package.json"),
    path.join(rootDir, "pnpm-workspace.yaml"),
    ...lockFileNames.map((fileName) => path.join(rootDir, fileName)),
  ];
  const nearestPackage = await findNearestPackageJson(
    projectDirectory,
    rootDir,
  );
  if (nearestPackage) {
    const packageDirectory = path.dirname(nearestPackage);
    candidates.push(
      nearestPackage,
      ...lockFileNames.map((fileName) => path.join(packageDirectory, fileName)),
    );
  }
  const unique = [
    ...new Set(candidates.map((candidate) => path.resolve(candidate))),
  ];
  const present = [];
  for (const candidate of unique) {
    if (await exists(candidate)) {
      present.push(candidate);
    }
  }
  return present.sort((left, right) => left.localeCompare(right));
};

export const resolveCacheDirectory = (
  rootDir,
  config,
  { enabled = true } = {},
) => {
  if (!enabled || config.cache === false) {
    return null;
  }
  if (typeof config.cache === "string") {
    return path.resolve(rootDir, config.cache);
  }
  return path.join(rootDir, ".coding-bible", "cache");
};

export const clearAnalyzerCache = async (cacheDirectory) => {
  if (cacheDirectory) {
    await rm(cacheDirectory, { force: true, recursive: true });
  }
};

export const createProjectCacheIdentity = ({ rootDir, tsconfigPath }) => {
  const projectKey = tsconfigPath
    ? normalizePath(path.relative(rootDir, tsconfigPath))
    : "<no-tsconfig>";
  return createHash("sha256").update(projectKey).digest("hex").slice(0, 20);
};

export const createProjectCacheSignatures = async (
  project,
  {
    config,
    includeProjectSignature = true,
    rootDir,
    ruleSelection,
    signal,
    sourceFilePaths,
  } = {},
) => {
  const startedAt = performance.now();
  signal?.throwIfAborted();

  const baseHash = createHash("sha256");
  baseHash.update(`cache-schema:${cacheSchemaVersion}\0`);
  baseHash.update(`typescript:${ts.version}\0`);
  baseHash.update(`analyzer:${await getImplementationSignature()}\0`);
  baseHash.update(`compiler:${stableStringify(project.options)}\0`);
  baseHash.update(
    `references:${stableStringify(project.projectReferences ?? [])}\0`,
  );
  baseHash.update(`config:${stableStringify(config)}\0`);
  baseHash.update(`selection:${stableStringify(ruleSelection ?? {})}\0`);

  const projectDirectory = project.tsconfigPath
    ? path.dirname(project.tsconfigPath)
    : rootDir;
  const metadataFiles = await getDependencyMetadataFiles(
    rootDir,
    projectDirectory,
  );
  for (const filePath of metadataFiles) {
    signal?.throwIfAborted();
    await updateFileHash(baseHash, filePath, rootDir, signal);
  }

  const baseSignature = baseHash.digest("hex");
  const selectedSourceFiles = [
    ...new Set(
      (sourceFilePaths ?? project.rootNames).map((filePath) =>
        path.resolve(filePath),
      ),
    ),
  ].sort((left, right) => left.localeCompare(right));
  const projectSourceFiles = includeProjectSignature
    ? [
        ...new Set(project.rootNames.map((filePath) => path.resolve(filePath))),
      ].sort((left, right) => left.localeCompare(right))
    : [];
  const filesToRead = [
    ...new Set([...selectedSourceFiles, ...projectSourceFiles]),
  ].sort((left, right) => left.localeCompare(right));
  const sourceInputs = await readHashInputs(filesToRead, rootDir, signal);
  const selectedRelativePaths = new Set(
    selectedSourceFiles.map((filePath) =>
      normalizePath(path.relative(rootDir, filePath)),
    ),
  );
  const projectRelativePaths = new Set(
    projectSourceFiles.map((filePath) =>
      normalizePath(path.relative(rootDir, filePath)),
    ),
  );
  const projectHash = includeProjectSignature
    ? createHash("sha256").update(baseSignature)
    : null;
  const sourceSignatures = {};

  for (const input of sourceInputs) {
    signal?.throwIfAborted();
    if (!input) {
      continue;
    }

    if (projectHash && projectRelativePaths.has(input.relativePath)) {
      updateHashWithInput(projectHash, input);
    }
    if (selectedRelativePaths.has(input.relativePath)) {
      const fileHash = createHash("sha256").update(baseSignature);
      updateHashWithInput(fileHash, input);
      sourceSignatures[input.relativePath] = fileHash.digest("hex");
    }
  }

  return {
    cacheMs: performance.now() - startedAt,
    projectSignature: projectHash?.digest("hex") ?? null,
    sourceSignatures,
  };
};

// Backward-compatible helper for callers that only need the conservative
// whole-project signature.
export const createProjectSignature = async (project, options = {}) => {
  const result = await createProjectCacheSignatures(project, options);
  return {
    cacheMs: result.cacheMs,
    signature: result.projectSignature,
  };
};

const getCacheFilePath = (cacheDirectory, projectIdentity) =>
  path.join(cacheDirectory, `${projectIdentity}.json`);

export const readProjectCache = async (cacheDirectory, projectIdentity) => {
  if (!cacheDirectory) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      await readFile(getCacheFilePath(cacheDirectory, projectIdentity), "utf8"),
    );
    if (
      parsed?.schemaVersion !== cacheSchemaVersion ||
      !parsed.sourceResults ||
      typeof parsed.sourceResults !== "object" ||
      !parsed.projectResults ||
      typeof parsed.projectResults !== "object"
    ) {
      return null;
    }
    return parsed;
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return null;
    }
    return null;
  }
};

export const writeProjectCache = async (
  cacheDirectory,
  projectIdentity,
  { projectResults, sourceResults },
) => {
  if (!cacheDirectory) {
    return;
  }
  await mkdir(cacheDirectory, { recursive: true });
  const filePath = getCacheFilePath(cacheDirectory, projectIdentity);
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(
    temporaryPath,
    `${JSON.stringify(
      {
        projectResults,
        schemaVersion: cacheSchemaVersion,
        sourceResults,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  try {
    await rename(temporaryPath, filePath);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      (error.code === "EEXIST" || error.code === "EPERM")
    ) {
      await rm(filePath, { force: true });
      await rename(temporaryPath, filePath);
    } else {
      throw error;
    }
  } finally {
    await rm(temporaryPath, { force: true });
  }
};
