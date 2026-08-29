import { createHash } from "node:crypto";
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

import ts from "typescript";

const cacheSchemaVersion = 1;
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

const updateFileHash = async (hash, filePath, rootDir) => {
  hash.update(normalizePath(path.relative(rootDir, filePath)));
  hash.update("\0");
  try {
    hash.update(await readFile(filePath));
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      hash.update("<missing>");
    } else {
      throw error;
    }
  }
  hash.update("\0");
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

export const createProjectSignature = async (
  project,
  { config, rootDir, signal } = {},
) => {
  const startedAt = performance.now();
  signal?.throwIfAborted();
  const hash = createHash("sha256");
  hash.update(`cache-schema:${cacheSchemaVersion}\0`);
  hash.update(`typescript:${ts.version}\0`);
  hash.update(`analyzer:${await getImplementationSignature()}\0`);
  hash.update(`compiler:${stableStringify(project.options)}\0`);
  hash.update(
    `references:${stableStringify(project.projectReferences ?? [])}\0`,
  );
  hash.update(`config:${stableStringify(config)}\0`);

  const sourceFiles = [
    ...new Set(project.rootNames.map((filePath) => path.resolve(filePath))),
  ].sort((left, right) => left.localeCompare(right));
  for (const filePath of sourceFiles) {
    signal?.throwIfAborted();
    await updateFileHash(hash, filePath, rootDir);
  }

  const projectDirectory = project.tsconfigPath
    ? path.dirname(project.tsconfigPath)
    : rootDir;
  const metadataFiles = await getDependencyMetadataFiles(
    rootDir,
    projectDirectory,
  );
  for (const filePath of metadataFiles) {
    signal?.throwIfAborted();
    await updateFileHash(hash, filePath, rootDir);
  }

  return {
    cacheMs: performance.now() - startedAt,
    signature: hash.digest("hex"),
  };
};

const getCacheFilePath = (cacheDirectory, projectIdentity) =>
  path.join(cacheDirectory, `${projectIdentity}.json`);

export const readProjectCache = async (
  cacheDirectory,
  projectIdentity,
  signature,
) => {
  if (!cacheDirectory) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      await readFile(getCacheFilePath(cacheDirectory, projectIdentity), "utf8"),
    );
    if (
      parsed?.schemaVersion !== cacheSchemaVersion ||
      parsed.signature !== signature ||
      !parsed.results ||
      typeof parsed.results !== "object"
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
  signature,
  results,
) => {
  if (!cacheDirectory) {
    return;
  }
  await mkdir(cacheDirectory, { recursive: true });
  const filePath = getCacheFilePath(cacheDirectory, projectIdentity);
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(
    temporaryPath,
    `${JSON.stringify(
      {
        schemaVersion: cacheSchemaVersion,
        signature,
        results,
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
