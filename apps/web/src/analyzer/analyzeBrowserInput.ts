import { analyzeProgram } from "@coding-bible/analyzer";

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
  const plans = createVirtualProjectPlans(input.files);
  const sourceFileCount = plans.reduce(
    (total, plan) => total + plan.fileNames.length,
    0,
  );
  const configurationDiagnostics: string[] = [];
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

      const result = analyzeProgram(project.program, [programInput])[0];
      if (!result) {
        throw new Error(
          `Analyzer returned no result for ${programInput.fileName}.`,
        );
      }

      fileResults.push({
        fileName: toDisplayFileName(programInput.fileName),
        language: programInput.language,
        result,
      });
      completed += 1;
    }
  }

  return {
    configurationDiagnostics,
    durationMs: performance.now() - startedAt,
    files: fileResults,
    mode: input.mode,
    sourceFileCount,
    tsconfigFileNames,
  };
};
