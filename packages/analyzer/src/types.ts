import type ts from "typescript";

export const analyzerLanguages = ["tsx", "ts", "jsx", "js"] as const;
export type AnalyzerLanguage = (typeof analyzerLanguages)[number];

export interface AnalyzeInput {
  source: string;
  language: AnalyzerLanguage;
  fileName?: string;
}

export interface SourceLocation {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
}

export interface AnalyzerFinding {
  detectorId: string;
  ruleId: string;
  message: string;
  suggestion: string;
  location: SourceLocation;
  excerpt: string;
}

export interface AnalyzeResult {
  checksRun: number;
  findings: readonly AnalyzerFinding[];
}

export interface DetectorContext {
  source: string;
  sourceFile: ts.SourceFile;
}

export interface Detector {
  id: string;
  ruleId: string;
  analyze: (context: DetectorContext) => readonly AnalyzerFinding[];
}
