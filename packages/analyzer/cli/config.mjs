import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { analyzerPacks } from "../src/index.ts";
import { compileGlobs, matchesAnyGlob, normalizePath } from "./glob.mjs";

const configFileNames = [
  "coding-bible.config.ts",
  "coding-bible.config.mts",
  "coding-bible.config.mjs",
  "coding-bible.config.js",
  "coding-bible.config.cjs",
  "coding-bible.config.json",
];

const validRuleSettings = new Set(["error", "warning", "off"]);
const validConfigKeys = new Set([
  "include",
  "ignore",
  "ignoreDefaults",
  "overrides",
  "packs",
  "rules",
  "tsconfig",
]);
const validOverrideKeys = new Set(["files", "packs", "rules"]);
const validPacks = new Set(analyzerPacks);

export const defaultIgnore = [
  "**/.coding-bible/**",
  "**/.git/**",
  "**/.next/**",
  "**/.turbo/**",
  "**/build/**",
  "**/coverage/**",
  "**/dist/**",
  "**/node_modules/**",
  "**/out/**",
  "**/*.d.ts",
  "**/*.generated.*",
  "**/__generated__/**",
];

const exists = async (filePath) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const assertStringArray = (value, name) => {
  if (value === undefined) {
    return;
  }

  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string" || !item.trim())
  ) {
    throw new Error(`${name} must be an array of non-empty strings.`);
  }
};

const assertSettings = (value, name, { validatePacks = false } = {}) => {
  if (value === undefined) {
    return;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object.`);
  }

  for (const [key, setting] of Object.entries(value)) {
    if (!key.trim()) {
      throw new Error(`${name} contains an empty setting key.`);
    }
    if (validatePacks && !validPacks.has(key)) {
      throw new Error(`${name} contains unknown analyzer pack "${key}".`);
    }
    if (!validRuleSettings.has(setting)) {
      throw new Error(`${name}.${key} must be "error", "warning", or "off".`);
    }
  }
};

const validateConfig = (config) => {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Coding Bible config must export an object.");
  }

  for (const key of Object.keys(config)) {
    if (!validConfigKeys.has(key)) {
      throw new Error(`Unknown Coding Bible config option "${key}".`);
    }
  }

  assertStringArray(config.include, "include");
  assertStringArray(config.ignore, "ignore");
  if (
    config.ignoreDefaults !== undefined &&
    typeof config.ignoreDefaults !== "boolean"
  ) {
    throw new Error("ignoreDefaults must be a boolean.");
  }
  assertSettings(config.packs, "packs", { validatePacks: true });
  assertSettings(config.rules, "rules");

  if (
    config.tsconfig !== undefined &&
    config.tsconfig !== false &&
    typeof config.tsconfig !== "string"
  ) {
    throw new Error("tsconfig must be a path string or false.");
  }

  if (config.overrides !== undefined) {
    if (!Array.isArray(config.overrides)) {
      throw new Error("overrides must be an array.");
    }

    config.overrides.forEach((override, index) => {
      if (
        !override ||
        typeof override !== "object" ||
        Array.isArray(override)
      ) {
        throw new Error(`overrides[${index}] must be an object.`);
      }
      for (const key of Object.keys(override)) {
        if (!validOverrideKeys.has(key)) {
          throw new Error(`Unknown overrides[${index}] option "${key}".`);
        }
      }
      assertStringArray(override.files, `overrides[${index}].files`);
      if (!override.files?.length) {
        throw new Error(
          `overrides[${index}].files must contain at least one glob.`,
        );
      }
      assertSettings(override.packs, `overrides[${index}].packs`, {
        validatePacks: true,
      });
      assertSettings(override.rules, `overrides[${index}].rules`);
    });
  }

  return config;
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
    for (const fileName of configFileNames) {
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

const packByRulePrefix = new Map([
  ["A11Y", "accessibility"],
  ["CORE", "core"],
  ["GQL", "graphql"],
  ["JS", "javascript"],
  ["LEGEND", "legend-state"],
  ["REACT", "react"],
  ["TS", "typescript"],
]);

export const getAnalyzerPack = (ruleId) =>
  packByRulePrefix.get(ruleId.split("-")[0]) ?? null;

const applySettings = (current, next) => (next === undefined ? current : next);

export const createConfigResolver = (config, cwd) => {
  const overrides = (config.overrides ?? []).map((override) => ({
    ...override,
    globs: compileGlobs(override.files),
  }));

  const getRuleSetting = (ruleId, filePath) => {
    const relativePath = normalizePath(path.relative(cwd, filePath));
    const pack = getAnalyzerPack(ruleId);
    let setting = pack ? config.packs?.[pack] : undefined;
    setting = applySettings(setting, config.rules?.[ruleId]);

    for (const override of overrides) {
      if (!matchesAnyGlob(relativePath, override.globs)) {
        continue;
      }
      if (pack) {
        setting = applySettings(setting, override.packs?.[pack]);
      }
      setting = applySettings(setting, override.rules?.[ruleId]);
    }

    return setting ?? "error";
  };

  return {
    getRuleSetting,
    isRuleEnabled: (ruleId, filePath) =>
      getRuleSetting(ruleId, filePath) !== "off",
  };
};

export const loadAnalyzerConfig = async ({
  cwd = process.cwd(),
  configPath,
} = {}) => {
  const startedAt = performance.now();
  const resolvedPath = await findConfigPath(cwd, configPath);
  const loaded = resolvedPath
    ? validateConfig(await loadConfigModule(resolvedPath))
    : {};
  const config = {
    ...loaded,
    include: loaded.include ?? ["**/*"],
    ignore: [
      ...(loaded.ignoreDefaults === false ? [] : defaultIgnore),
      ...(loaded.ignore ?? []),
    ],
  };

  return {
    config,
    configPath: resolvedPath,
    rootDir: resolvedPath ? path.dirname(resolvedPath) : cwd,
    loadMs: performance.now() - startedAt,
  };
};
