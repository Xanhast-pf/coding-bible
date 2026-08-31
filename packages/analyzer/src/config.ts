import {
  analyzerPacks,
  type AnalyzerConfig,
  type AnalyzerPack,
  type AnalyzerRuleSetting,
} from "./types.ts";
import { detectors } from "./detectors/index.ts";
import { compileGlobs, matchesAnyGlob, normalizeGlobPath } from "./glob.ts";

export const analyzerConfigFileNames = [
  "coding-bible.config.ts",
  "coding-bible.config.mts",
  "coding-bible.config.mjs",
  "coding-bible.config.js",
  "coding-bible.config.cjs",
  "coding-bible.config.json",
] as const;

export const defaultAnalyzerIgnorePatterns = [
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
] as const;

const validRuleSettings = new Set<AnalyzerRuleSetting>([
  "error",
  "warning",
  "off",
]);
const validConfigKeys = new Set([
  "baseline",
  "cache",
  "include",
  "ignore",
  "ignoreDefaults",
  "overrides",
  "packs",
  "rules",
  "tsconfig",
]);
const validOverrideKeys = new Set(["files", "packs", "rules"]);
const validPacks = new Set<AnalyzerPack>(analyzerPacks);
const validRuleIds = new Set(detectors.map((detector) => detector.ruleId));

const toRecord = (value: unknown, message: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(message);
  }

  return value as Record<string, unknown>;
};

const assertStringArray = (value: unknown, name: string) => {
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

const assertSettings = (
  value: unknown,
  name: string,
  {
    validatePacks = false,
    validateRules = false,
  }: { validatePacks?: boolean; validateRules?: boolean } = {},
) => {
  if (value === undefined) {
    return;
  }

  const settings = toRecord(value, `${name} must be an object.`);
  for (const [key, setting] of Object.entries(settings)) {
    if (!key.trim()) {
      throw new Error(`${name} contains an empty setting key.`);
    }
    if (validatePacks && !validPacks.has(key as AnalyzerPack)) {
      throw new Error(`${name} contains unknown analyzer pack "${key}".`);
    }
    if (validateRules && !validRuleIds.has(key)) {
      throw new Error(`${name} contains unknown automated rule "${key}".`);
    }
    if (!validRuleSettings.has(setting as AnalyzerRuleSetting)) {
      throw new Error(`${name}.${key} must be "error", "warning", or "off".`);
    }
  }
};

export const validateAnalyzerConfig = (value: unknown): AnalyzerConfig => {
  const config = toRecord(value, "Coding Bible config must export an object.");

  for (const key of Object.keys(config)) {
    if (!validConfigKeys.has(key)) {
      throw new Error(`Unknown Coding Bible config option "${key}".`);
    }
  }

  if (
    config.baseline !== undefined &&
    config.baseline !== false &&
    (typeof config.baseline !== "string" || !config.baseline.trim())
  ) {
    throw new Error("baseline must be a non-empty path string or false.");
  }
  if (
    config.cache !== undefined &&
    config.cache !== false &&
    config.cache !== true &&
    (typeof config.cache !== "string" || !config.cache.trim())
  ) {
    throw new Error(
      "cache must be true, false, or a non-empty directory path.",
    );
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
  assertSettings(config.rules, "rules", { validateRules: true });

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
      const item = toRecord(override, `overrides[${index}] must be an object.`);
      for (const key of Object.keys(item)) {
        if (!validOverrideKeys.has(key)) {
          throw new Error(`Unknown overrides[${index}] option "${key}".`);
        }
      }
      assertStringArray(item.files, `overrides[${index}].files`);
      if (!Array.isArray(item.files) || !item.files.length) {
        throw new Error(
          `overrides[${index}].files must contain at least one glob.`,
        );
      }
      assertSettings(item.packs, `overrides[${index}].packs`, {
        validatePacks: true,
      });
      assertSettings(item.rules, `overrides[${index}].rules`, {
        validateRules: true,
      });
    });
  }

  return config as AnalyzerConfig;
};

export interface ResolvedAnalyzerConfig extends AnalyzerConfig {
  include: readonly string[];
  ignore: readonly string[];
}

export const resolveAnalyzerConfigDefaults = (
  config: AnalyzerConfig,
): ResolvedAnalyzerConfig => ({
  ...config,
  include: config.include ?? ["**/*"],
  ignore: [
    ...(config.ignoreDefaults === false ? [] : defaultAnalyzerIgnorePatterns),
    ...(config.ignore ?? []),
  ],
});

const packByRulePrefix = new Map<string, AnalyzerPack>([
  ["A11Y", "accessibility"],
  ["CORE", "core"],
  ["GQL", "graphql"],
  ["JS", "javascript"],
  ["LEGEND", "legend-state"],
  ["REACT", "react"],
  ["TS", "typescript"],
]);

export const getAnalyzerPack = (ruleId: string): AnalyzerPack | null =>
  packByRulePrefix.get(ruleId.split("-")[0] ?? "") ?? null;

const applySettings = (
  current: AnalyzerRuleSetting | undefined,
  next: AnalyzerRuleSetting | undefined,
) => (next === undefined ? current : next);

export const createAnalyzerConfigResolver = (
  config: AnalyzerConfig,
  toRelativeFilePath: (filePath: string) => string = (filePath) => filePath,
) => {
  const overrides = (config.overrides ?? []).map((override) => ({
    ...override,
    globs: compileGlobs(override.files),
  }));

  const getRuleSetting = (
    ruleId: string,
    filePath: string,
  ): AnalyzerRuleSetting => {
    const relativePath = normalizeGlobPath(toRelativeFilePath(filePath));
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
    isRuleEnabled: (ruleId: string, filePath: string) =>
      getRuleSetting(ruleId, filePath) !== "off",
  };
};

export const createAnalyzerFileSelector = (config: ResolvedAnalyzerConfig) => {
  const include = compileGlobs(config.include);
  const ignore = compileGlobs(config.ignore);

  return (filePath: string) => {
    const normalized = normalizeGlobPath(filePath);
    return (
      matchesAnyGlob(normalized, include) && !matchesAnyGlob(normalized, ignore)
    );
  };
};

export const defineConfig = <const TConfig extends AnalyzerConfig>(
  config: TConfig,
): TConfig => config;
