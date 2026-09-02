import {
  analyzerConfigFileNames,
  createAnalyzerConfigResolver,
  createAnalyzerCustomRuleDetectors,
  createAnalyzerFileSelector,
  getAnalyzerCustomRuleFilePaths,
  getConfiguredAnalyzerRuleIds,
  resolveAnalyzerConfigDefaults,
  validateAnalyzerConfig,
  validateAnalyzerCustomRuleBook,
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

const findProjectFile = (
  files: readonly BrowserProjectFile[],
  fileName: string,
) =>
  files.find((file) => normalizeRelativeFileName(file.fileName) === fileName);

const loadBrowserCustomRules = (
  config: unknown,
  files: readonly BrowserProjectFile[],
) =>
  getAnalyzerCustomRuleFilePaths(config).flatMap((fileName) => {
    const ruleFile = findProjectFile(files, fileName);
    if (!ruleFile) {
      throw new Error(
        `Could not load custom rule file "${fileName}": file was not found in the selected project.`,
      );
    }
    try {
      return validateAnalyzerCustomRuleBook(
        JSON.parse(ruleFile.source),
        `custom rule file "${fileName}"`,
      ).rules;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown custom rule error.";
      throw new Error(
        `Could not load custom rule file "${fileName}": ${message}`,
      );
    }
  });

export const loadBrowserAnalyzerConfig = (
  files: readonly BrowserProjectFile[],
): BrowserAnalyzerConfig => {
  const configFileName = findRootConfigFile(files);
  const configurationDiagnostics: string[] = [];
  let loadedConfig = {};

  if (configFileName === browserConfigFileName) {
    const configFile = findProjectFile(files, browserConfigFileName);

    if (!configFile) {
      throw new Error(`Could not read ${browserConfigFileName}.`);
    }

    try {
      const rawConfig = JSON.parse(configFile.source);
      const additionalCustomRules = loadBrowserCustomRules(rawConfig, files);
      loadedConfig = validateAnalyzerConfig(rawConfig, {
        additionalCustomRules,
      });
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
