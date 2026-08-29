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

export interface AnalyzerDiagnostic {
  message: string;
  location: SourceLocation;
  excerpt: string;
}

export interface AnalyzeResult {
  checksRun: number;
  diagnostics: readonly AnalyzerDiagnostic[];
  findings: readonly AnalyzerFinding[];
  ruleIdsChecked: readonly string[];
}

export interface ImportBinding {
  importedName: string;
  isTypeOnly: boolean;
  kind: "default" | "named" | "namespace";
  local: ts.Identifier;
  moduleName: string;
  symbol: ts.Symbol | null;
}

export interface DetectorContext {
  checker: ts.TypeChecker;
  importsBySymbol: ReadonlyMap<ts.Symbol, ImportBinding>;
  language: AnalyzerLanguage;
  nodesByKind: ReadonlyMap<ts.SyntaxKind, readonly ts.Node[]>;
  program: ts.Program;
  referencesBySymbol: ReadonlyMap<ts.Symbol, readonly ts.Identifier[]>;
  source: string;
  sourceFile: ts.SourceFile;
}

export interface Detector {
  id: string;
  ruleId: string;
  languages?: readonly AnalyzerLanguage[];
  analyze: (context: DetectorContext) => readonly AnalyzerFinding[];
}
