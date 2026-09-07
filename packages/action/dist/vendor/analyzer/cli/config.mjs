import { access, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  analyzerConfigFileNames,
  createAnalyzerConfigResolver,
  defaultAnalyzerIgnorePatterns,
  getAnalyzerCustomRuleFilePaths,
  getAnalyzerPack,
  resolveAnalyzerConfigDefaults,
  validateAnalyzerConfig,
  validateAnalyzerCustomRuleBook,
} from "../src/index.mjs";
import { normalizePath } from "./glob.mjs";

export const defaultIgnore = defaultAnalyzerIgnorePatterns;
export { getAnalyzerPack };

const exists = async (filePath) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const isInside = (parent, candidate) => {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

const resolveBoundaryRoot = async (cwd, boundaryRoot) =>
  boundaryRoot ? realpath(path.resolve(cwd, boundaryRoot)) : null;

const assertInsideBoundary = async (filePath, boundaryRoot, label) => {
  if (!boundaryRoot) {
    return filePath;
  }

  const resolved = await realpath(filePath);
  if (!isInside(boundaryRoot, resolved)) {
    throw new Error(
      `${label} must stay inside the configured analysis boundary.`,
    );
  }
  return resolved;
};

const loadConfigModule = async (filePath) => {
  if (path.extname(filePath) === ".json") {
    return JSON.parse(await readFile(filePath, "utf8"));
  }

  const url = pathToFileURL(filePath);
  url.searchParams.set("coding-bible", String(Date.now()));
  const module = await import(url.href);
  return module.default ?? module;
};

const loadCustomRuleFiles = async (config, rootDir, boundaryRoot) => {
  const rules = [];
  for (const filePath of getAnalyzerCustomRuleFilePaths(config)) {
    try {
      const requestedPath = path.resolve(rootDir, filePath);
      const resolvedPath = await assertInsideBoundary(
        requestedPath,
        boundaryRoot,
        `Custom rule file "${filePath}"`,
      );
      const source = await readFile(resolvedPath, "utf8");
      const ruleBook = validateAnalyzerCustomRuleBook(
        JSON.parse(source),
        `custom rule file "${filePath}"`,
      );
      rules.push(...ruleBook.rules);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown custom rule error.";
      throw new Error(
        `Could not load custom rule file "${filePath}": ${message}`,
      );
    }
  }
  return rules;
};

const findConfigPath = async (cwd, explicitPath, boundaryRoot) => {
  if (explicitPath) {
    const requested = path.resolve(cwd, explicitPath);
    if (!(await exists(requested))) {
      throw new Error(`Coding Bible config not found: ${explicitPath}`);
    }
    return assertInsideBoundary(requested, boundaryRoot, "Coding Bible config");
  }

  let directory = cwd;
  while (!boundaryRoot || isInside(boundaryRoot, directory)) {
    for (const fileName of analyzerConfigFileNames) {
      const candidate = path.join(directory, fileName);
      if (await exists(candidate)) {
        return assertInsideBoundary(
          candidate,
          boundaryRoot,
          "Coding Bible config",
        );
      }
    }

    if (boundaryRoot && directory === boundaryRoot) {
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

export const createConfigResolver = (config, cwd) =>
  createAnalyzerConfigResolver(config, (filePath) =>
    normalizePath(path.relative(cwd, filePath)),
  );

export const loadAnalyzerConfig = async ({
  cwd = process.cwd(),
  configPath,
  boundaryRoot,
} = {}) => {
  const startedAt = performance.now();
  const resolvedCwd = await realpath(cwd);
  const resolvedBoundaryRoot = await resolveBoundaryRoot(cwd, boundaryRoot);
  if (resolvedBoundaryRoot && !isInside(resolvedBoundaryRoot, resolvedCwd)) {
    throw new Error(
      "Analyzer cwd must stay inside the configured analysis boundary.",
    );
  }
  const resolvedPath = await findConfigPath(
    resolvedCwd,
    configPath,
    resolvedBoundaryRoot,
  );
  const rootDir = resolvedPath ? path.dirname(resolvedPath) : resolvedCwd;
  const rawConfig = resolvedPath ? await loadConfigModule(resolvedPath) : {};
  const additionalCustomRules = resolvedPath
    ? await loadCustomRuleFiles(rawConfig, rootDir, resolvedBoundaryRoot)
    : [];
  const loaded = validateAnalyzerConfig(rawConfig, { additionalCustomRules });
  const config = resolveAnalyzerConfigDefaults(loaded);

  return {
    boundaryRoot: resolvedBoundaryRoot,
    config,
    configPath: resolvedPath,
    cwd: resolvedCwd,
    rootDir,
    loadMs: performance.now() - startedAt,
  };
};
