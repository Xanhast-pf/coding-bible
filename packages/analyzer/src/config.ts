import {
  analyzerPacks,
  type AnalyzerConfig,
  type AnalyzerPack,
  type AnalyzerRuleSelection,
  type AnalyzerRuleSetting,
} from "./types.ts";
import { detectors } from "./detectors/index.ts";
import { validateAnalyzerCustomRules } from "./customRules.ts";
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
  "**/generated/**",
  "**/node_modules/**",
  "**/out/**",
  "**/third-party/**",
  "**/third_party/**",
  "**/vendor/**",
  "**/vendors/**",
  "**/public/static/**",
  "**/*.d.ts",
  "**/*.generated.*",
  "**/*.min.{js,jsx,mjs,cjs,ts,tsx,mts,cts}",
  "**/__generated__/**",
] as const;

const analyzerRuleSettings = [
  "error",
  "warning",
  "off",
] as const satisfies readonly AnalyzerRuleSetting[];
const validRuleSettings: ReadonlySet<unknown> = new Set(analyzerRuleSettings);
const validConfigKeys = new Set([
  "customRules",
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
export const analyzerRuleIds = [
  ...new Set(detectors.map((detector) => detector.ruleId)),
].sort();
const validRuleIds = new Set(analyzerRuleIds);
export const getConfiguredAnalyzerRuleIds = (
  config: Pick<AnalyzerConfig, "customRules"> = {},
): readonly string[] =>
  [
    ...new Set([
      ...analyzerRuleIds,
      ...validateAnalyzerCustomRules(config.customRules).map(({ id }) => id),
    ]),
  ].sort();

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
    ruleIds = validRuleIds,
  }: {
    ruleIds?: ReadonlySet<string>;
    validatePacks?: boolean;
    validateRules?: boolean;
  } = {},
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
    if (validateRules && !ruleIds.has(key)) {
      throw new Error(`${name} contains unknown automated rule "${key}".`);
    }
    if (!validRuleSettings.has(setting)) {
      throw new Error(`${name}.${key} must be "error", "warning", or "off".`);
    }
  }
};

const assertRuleIdList = (
  value: readonly string[] | undefined,
  name: string,
  ruleIds: ReadonlySet<string> = validRuleIds,
) => {
  if (value === undefined) {
    return;
  }

  for (const ruleId of value) {
    if (!ruleIds.has(ruleId)) {
      throw new Error(`${name} contains unknown automated rule "${ruleId}".`);
    }
  }
};

export const normalizeAnalyzerRuleSelection = (
  selection: AnalyzerRuleSelection = {},
  ruleIds: readonly string[] = analyzerRuleIds,
): AnalyzerRuleSelection => {
  const validSelectionRuleIds = new Set(ruleIds);
  const include = selection.include
    ? [
        ...new Set(
          selection.include.map((ruleId) => ruleId.trim()).filter(Boolean),
        ),
      ].sort()
    : undefined;
  const exclude = selection.exclude
    ? [
        ...new Set(
          selection.exclude.map((ruleId) => ruleId.trim()).filter(Boolean),
        ),
      ].sort()
    : undefined;

  assertRuleIdList(include, "rule selection include", validSelectionRuleIds);
  assertRuleIdList(exclude, "rule selection exclude", validSelectionRuleIds);

  return {
    ...(exclude?.length ? { exclude } : {}),
    ...(include?.length ? { include } : {}),
  };
};

export const createAnalyzerRuleSelectionPredicate = (
  selection: AnalyzerRuleSelection = {},
  ruleIds: readonly string[] = analyzerRuleIds,
) => {
  const normalized = normalizeAnalyzerRuleSelection(selection, ruleIds);
  const include = normalized.include ? new Set(normalized.include) : null;
  const exclude = new Set(normalized.exclude ?? []);

  return (ruleId: string) =>
    (!include || include.has(ruleId)) && !exclude.has(ruleId);
};

export const validateAnalyzerConfig = (value: unknown): AnalyzerConfig => {
  const config = toRecord(value, "Coding Bible config must export an object.");
  const customRules = validateAnalyzerCustomRules(config.customRules);
  for (const { id } of customRules) {
    if (validRuleIds.has(id)) {
      throw new Error(
        `customRules must not reuse built-in automated rule ID "${id}".`,
      );
    }
  }
  const configuredRuleIds = new Set(
    getConfiguredAnalyzerRuleIds({ customRules }),
  );

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
  assertSettings(config.rules, "rules", {
    ruleIds: configuredRuleIds,
    validateRules: true,
  });

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
        ruleIds: configuredRuleIds,
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
  ["AI", "ai"],
  ["APOLLO", "apollo"],
  ["ARCH", "architecture"],
  ["CORE", "core"],
  ["CSS", "css"],
  ["DEP", "dependencies"],
  ["FLAG", "feature-flags"],
  ["GQL", "graphql"],
  ["I18N", "internationalization"],
  ["JS", "javascript"],
  ["LEGEND", "legend-state"],
  ["NEXT", "nextjs"],
  ["PERF", "performance"],
  ["REACT", "react"],
  ["REDUX", "redux"],
  ["TQ", "tanstack-query"],
  ["TEST", "testing"],
  ["TS", "typescript"],
  ["WORK", "workflow"],
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
