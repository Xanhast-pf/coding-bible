import type {
  AnalyzeResult,
  AnalyzerFinding,
  AnalyzerLanguage,
  AnalyzerRuleSelection,
  AnalyzerRuleSetting,
} from "@coding-bible/analyzer";

export type BrowserAnalyzerMode = "snippet" | "project";

export interface BrowserProjectFile {
  fileName: string;
  source: string;
}

export interface BrowserAnalyzeInput {
  files: readonly BrowserProjectFile[];
  mode: BrowserAnalyzerMode;
  ruleSelection?: AnalyzerRuleSelection;
}

export interface BrowserAnalyzerFinding extends AnalyzerFinding {
  severity: Exclude<AnalyzerRuleSetting, "off">;
}

export interface BrowserFileAnalyzeResult extends Omit<
  AnalyzeResult,
  "findings"
> {
  findings: readonly BrowserAnalyzerFinding[];
}

export interface BrowserFileResult {
  fileName: string;
  language: AnalyzerLanguage;
  result: BrowserFileAnalyzeResult;
}

export interface BrowserAnalyzeResult {
  configFileName: string | null;
  configurationDiagnostics: readonly string[];
  durationMs: number;
  files: readonly BrowserFileResult[];
  mode: BrowserAnalyzerMode;
  ruleSelection: AnalyzerRuleSelection;
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
