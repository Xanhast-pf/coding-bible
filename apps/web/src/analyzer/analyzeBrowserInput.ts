import {
  analyzeProgram,
  createAnalyzerRuleSelectionPredicate,
  normalizeAnalyzerRuleSelection,
} from "@coding-bible/analyzer";

import { loadBrowserAnalyzerConfig } from "./browserConfig.ts";
import { normalizeRelativeFileName } from "./fileTypes.ts";
import {
  createVirtualProject,
  createVirtualProjectPlans,
  toDisplayFileName,
} from "./virtualProject.ts";
import type {
  BrowserAnalyzeInput,
  BrowserAnalyzeResult,
  BrowserAnalyzerProgress,
  BrowserFileResult,
} from "./types";

export const analyzeBrowserInput = (
  input: BrowserAnalyzeInput,
  libraryFiles: Readonly<Record<string, string>>,
  onProgress: (progress: BrowserAnalyzerProgress) => void = () => {},
): BrowserAnalyzeResult => {
  const startedAt = performance.now();
  const ruleSelection = normalizeAnalyzerRuleSelection(input.ruleSelection);
  const ruleSelected = createAnalyzerRuleSelectionPredicate(ruleSelection);
  const browserConfig =
    input.mode === "project"
      ? loadBrowserAnalyzerConfig(input.files)
      : loadBrowserAnalyzerConfig([]);

  if (typeof browserConfig.tsconfig === "string") {
    const configuredTsconfig = normalizeRelativeFileName(
      browserConfig.tsconfig,
    );
    const hasConfiguredTsconfig = input.files.some(
      ({ fileName }) =>
        normalizeRelativeFileName(fileName) === configuredTsconfig,
    );
    if (!hasConfiguredTsconfig) {
      throw new Error(
        `Configured tsconfig not found: ${browserConfig.tsconfig}`,
      );
    }
  }

  const plans = createVirtualProjectPlans(input.files, {
    shouldAnalyzeFile: browserConfig.shouldAnalyzeFile,
    ...(browserConfig.tsconfig === undefined
      ? {}
      : { tsconfig: browserConfig.tsconfig }),
  });
  const sourceFileCount = plans.reduce(
    (total, plan) => total + plan.fileNames.length,
    0,
  );
  const configurationDiagnostics = [...browserConfig.configurationDiagnostics];
  const fileResults: BrowserFileResult[] = [];
  const tsconfigFileNames = plans.flatMap((plan) =>
    plan.tsconfigFileName ? [plan.tsconfigFileName] : [],
  );
  let completed = 0;

  onProgress({
    message: "Preparing local TypeScript project…",
    phase: "preparing",
  });

  for (const plan of plans) {
    const projectLabel = plan.tsconfigFileName ?? "browser defaults";
    onProgress({
      message: `Building ${projectLabel} · ${plan.fileNames.length} source files`,
      phase: "program",
    });

    const project = createVirtualProject(
      input.files,
      libraryFiles,
      plan.tsconfigFileName,
      plan.fileNames,
    );
    configurationDiagnostics.push(
      ...project.configurationDiagnostics.map(
        (message) => `${projectLabel}: ${message}`,
      ),
    );

    for (const programInput of project.inputs) {
      onProgress({
        completed,
        message: `Analyzing ${toDisplayFileName(programInput.fileName)}…`,
        phase: "analyzing",
        total: sourceFileCount,
      });

      const result = analyzeProgram(project.program, [programInput], {
        isRuleEnabled: (ruleId, fileName) =>
          ruleSelected(ruleId) &&
          browserConfig.resolver.isRuleEnabled(ruleId, fileName),
      })[0];
      if (!result) {
        throw new Error(
          `Analyzer returned no result for ${programInput.fileName}.`,
        );
      }

      const fileName = toDisplayFileName(programInput.fileName);
      fileResults.push({
        fileName,
        language: programInput.language,
        result: {
          ...result,
          findings: result.findings.map((finding) => {
            const severity = browserConfig.resolver.getRuleSetting(
              finding.ruleId,
              fileName,
            );

            return {
              ...finding,
              severity: severity === "warning" ? "warning" : "error",
            };
          }),
        },
      });
      completed += 1;
    }
  }

  fileResults.sort((left, right) =>
    left.fileName.localeCompare(right.fileName),
  );

  return {
    configFileName: browserConfig.configFileName,
    configurationDiagnostics,
    durationMs: performance.now() - startedAt,
    files: fileResults,
    mode: input.mode,
    ruleSelection,
    sourceFileCount,
    tsconfigFileNames,
  };
};
