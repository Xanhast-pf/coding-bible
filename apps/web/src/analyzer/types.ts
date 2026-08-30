import type { AnalyzeResult, AnalyzerLanguage } from "@coding-bible/analyzer";

export type BrowserAnalyzerMode = "snippet" | "project";

export interface BrowserProjectFile {
  fileName: string;
  source: string;
}

export interface BrowserAnalyzeInput {
  files: readonly BrowserProjectFile[];
  mode: BrowserAnalyzerMode;
}

export interface BrowserFileResult {
  fileName: string;
  language: AnalyzerLanguage;
  result: AnalyzeResult;
}

export interface BrowserAnalyzeResult {
  configurationDiagnostics: readonly string[];
  durationMs: number;
  files: readonly BrowserFileResult[];
  mode: BrowserAnalyzerMode;
  sourceFileCount: number;
  tsconfigFileNames: readonly string[];
}

export type BrowserAnalyzerProgressPhase =
  "preparing" | "program" | "analyzing";

export interface BrowserAnalyzerProgress {
  completed?: number;
  message: string;
  phase: BrowserAnalyzerProgressPhase;
  total?: number;
}

export interface BrowserAnalyzerRequest {
  id: number;
  input: BrowserAnalyzeInput;
  type: "analyze";
}

export type BrowserAnalyzerResponse =
  | {
      id: number;
      progress: BrowserAnalyzerProgress;
      type: "progress";
    }
  | {
      id: number;
      result: BrowserAnalyzeResult;
      type: "result";
    }
  | {
      id: number;
      message: string;
      type: "error";
    };
