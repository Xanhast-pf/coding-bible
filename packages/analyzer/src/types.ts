import type ts from "typescript";

export const analyzerLanguages = ["tsx", "ts", "jsx", "js"] as const;
export type AnalyzerLanguage = (typeof analyzerLanguages)[number];

export const analyzerPacks = [
  "accessibility",
  "core",
  "graphql",
  "internationalization",
  "javascript",
  "legend-state",
  "react",
  "typescript",
] as const;
export type AnalyzerPack = (typeof analyzerPacks)[number];

export type AnalyzerRuleSetting = "error" | "warning" | "off";

export interface AnalyzerConfigOverride {
  files: readonly string[];
  packs?: Partial<Record<AnalyzerPack, AnalyzerRuleSetting>>;
  rules?: Readonly<Record<string, AnalyzerRuleSetting>>;
}

export interface AnalyzerConfig {
  baseline?: string | false;
  cache?: string | boolean;
  include?: readonly string[];
  ignore?: readonly string[];
  ignoreDefaults?: boolean;
  packs?: Partial<Record<AnalyzerPack, AnalyzerRuleSetting>>;
  rules?: Readonly<Record<string, AnalyzerRuleSetting>>;
  overrides?: readonly AnalyzerConfigOverride[];
  tsconfig?: string | false;
}

export interface AnalyzeInput {
  source: string;
  language: AnalyzerLanguage;
  fileName?: string;
}

export interface ProgramAnalyzeInput {
  fileName: string;
  language: AnalyzerLanguage;
}

export type AnalyzerDetectorDependencyScope = "source-file" | "project";

export interface AnalyzerRuleSelection {
  exclude?: readonly string[];
  include?: readonly string[];
}

export interface AnalyzeOptions {
  dependencyScope?: AnalyzerDetectorDependencyScope;
  isRuleEnabled?: (ruleId: string, fileName: string) => boolean;
  signal?: AbortSignal;
}

export type AnalyzerFixSafety = "safe" | "review";

export const analyzerFindingImpacts = ["high", "medium", "low"] as const;
export type AnalyzerFindingImpact = (typeof analyzerFindingImpacts)[number];

export const analyzerFindingConfidences = [
  "certain",
  "strong",
  "contextual",
] as const;
export type AnalyzerFindingConfidence =
  (typeof analyzerFindingConfidences)[number];

export interface AnalyzerTextEdit {
  start: number;
  end: number;
  replacement: string;
}

export interface AnalyzerSuggestedFix {
  title: string;
  description: string;
  safety: AnalyzerFixSafety;
  edits?: readonly AnalyzerTextEdit[];
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
  fix?: AnalyzerSuggestedFix;
  location: SourceLocation;
  excerpt: string;
  confidence?: AnalyzerFindingConfidence;
  contextNote?: string;
  impact?: AnalyzerFindingImpact;
}

export interface ResolvedAnalyzerFinding extends AnalyzerFinding {
  confidence: AnalyzerFindingConfidence;
  impact: AnalyzerFindingImpact;
}

export interface AnalyzerDiagnostic {
  message: string;
  location: SourceLocation;
  excerpt: string;
}

export interface AnalyzeResult {
  checksRun: number;
  diagnostics: readonly AnalyzerDiagnostic[];
  findings: readonly ResolvedAnalyzerFinding[];
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
  identifiersByText: ReadonlyMap<string, readonly ts.Identifier[]>;
  source: string;
  sourceFile: ts.SourceFile;
}

export interface Detector {
  dependencyScope: AnalyzerDetectorDependencyScope;
  id: string;
  ruleId: string;
  languages?: readonly AnalyzerLanguage[];
  analyze: (context: DetectorContext) => readonly AnalyzerFinding[];
}
