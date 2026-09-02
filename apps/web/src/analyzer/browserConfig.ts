import {
  analyzerConfigFileNames,
  createAnalyzerConfigResolver,
  createAnalyzerFileSelector,
  resolveAnalyzerConfigDefaults,
  validateAnalyzerConfig,
  createAnalyzerCustomRuleDetectors,
  getConfiguredAnalyzerRuleIds,
} from "@coding-bible/analyzer";

import { normalizeRelativeFileName } from "./fileTypes.ts";
import type { BrowserProjectFile } from "./types";

const browserConfigFileName = "coding-bible.config.json";

export interface BrowserAnalyzerConfig {
  additionalDetectors: ReturnType<typeof createAnalyzerCustomRuleDetectors>;
  configFileName: string | null;
  configurationDiagnostics: readonly string[];
  resolver: ReturnType<typeof createAnalyzerConfigResolver>;
  ruleIds: readonly string[];
  shouldAnalyzeFile: (fileName: string) => boolean;
  tsconfig: string | false | undefined;
}

const findRootConfigFile = (files: readonly BrowserProjectFile[]) => {
  const fileNames = new Set(
    files.map(({ fileName }) => normalizeRelativeFileName(fileName)),
  );

  return analyzerConfigFileNames.find((fileName) => fileNames.has(fileName));
};

export const loadBrowserAnalyzerConfig = (
  files: readonly BrowserProjectFile[],
): BrowserAnalyzerConfig => {
  const configFileName = findRootConfigFile(files);
  const configurationDiagnostics: string[] = [];
  let loadedConfig = {};

  if (configFileName === browserConfigFileName) {
    const configFile = files.find(
      ({ fileName }) =>
        normalizeRelativeFileName(fileName) === browserConfigFileName,
    );

    if (!configFile) {
      throw new Error(`Could not read ${browserConfigFileName}.`);
    }

    try {
      loadedConfig = validateAnalyzerConfig(JSON.parse(configFile.source));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown config error.";
      throw new Error(`${browserConfigFileName}: ${message}`);
    }
  } else if (configFileName) {
    configurationDiagnostics.push(
      `${configFileName} was detected but is not executed in the browser. Project mode currently auto-loads only ${browserConfigFileName}; use the CLI or GitHub Action for executable config modules.`,
    );
  }

  const config = resolveAnalyzerConfigDefaults(loadedConfig);

  return {
    configFileName: configFileName ?? null,
    additionalDetectors: createAnalyzerCustomRuleDetectors(config.customRules),
    configurationDiagnostics,
    resolver: createAnalyzerConfigResolver(config),
    ruleIds: getConfiguredAnalyzerRuleIds(config),
    shouldAnalyzeFile: createAnalyzerFileSelector(config),
    tsconfig: config.tsconfig,
  };
};
