import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  analyzerConfigFileNames,
  createAnalyzerConfigResolver,
  defaultAnalyzerIgnorePatterns,
  getAnalyzerPack,
  resolveAnalyzerConfigDefaults,
  validateAnalyzerConfig,
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

const loadConfigModule = async (filePath) => {
  if (path.extname(filePath) === ".json") {
    return JSON.parse(await readFile(filePath, "utf8"));
  }

  const url = pathToFileURL(filePath);
  url.searchParams.set("coding-bible", String(Date.now()));
  const module = await import(url.href);
  return module.default ?? module;
};

const findConfigPath = async (cwd, explicitPath) => {
  if (explicitPath) {
    const resolved = path.resolve(cwd, explicitPath);
    if (!(await exists(resolved))) {
      throw new Error(`Coding Bible config not found: ${explicitPath}`);
    }
    return resolved;
  }

  let directory = cwd;
  while (true) {
    for (const fileName of analyzerConfigFileNames) {
      const candidate = path.join(directory, fileName);
      if (await exists(candidate)) {
        return candidate;
      }
    }

    const parent = path.dirname(directory);
    if (parent === directory) {
      return null;
    }
    directory = parent;
  }
};

export const createConfigResolver = (config, cwd) =>
  createAnalyzerConfigResolver(config, (filePath) =>
    normalizePath(path.relative(cwd, filePath)),
  );

export const loadAnalyzerConfig = async ({
  cwd = process.cwd(),
  configPath,
} = {}) => {
  const startedAt = performance.now();
  const resolvedPath = await findConfigPath(cwd, configPath);
  const loaded = resolvedPath
    ? validateAnalyzerConfig(await loadConfigModule(resolvedPath))
    : {};
  const config = resolveAnalyzerConfigDefaults(loaded);

  return {
    config,
    configPath: resolvedPath,
    rootDir: resolvedPath ? path.dirname(resolvedPath) : cwd,
    loadMs: performance.now() - startedAt,
  };
};
