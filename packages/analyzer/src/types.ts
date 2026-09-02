import type ts from "typescript";

export const analyzerLanguages = ["tsx", "ts", "jsx", "js"] as const;
export type AnalyzerLanguage = (typeof analyzerLanguages)[number];

export const analyzerPacks = [
  "accessibility",
  "ai",
  "apollo",
  "architecture",
  "core",
  "css",
  "dependencies",
  "feature-flags",
  "graphql",
  "internationalization",
  "javascript",
  "legend-state",
  "nextjs",
  "performance",
  "react",
  "redux",
  "tanstack-query",
  "testing",
  "typescript",
  "workflow",
] as const;
export type AnalyzerPack = (typeof analyzerPacks)[number];

export type AnalyzerRuleSetting = "error" | "warning" | "off";

export interface AnalyzerConfigOverride {
  files: readonly string[];
  packs?: Partial<Record<AnalyzerPack, AnalyzerRuleSetting>>;
  rules?: Readonly<Record<string, AnalyzerRuleSetting>>;
}

export interface AnalyzerConfig {
  customRuleFiles?: readonly string[];
  customRules?: readonly AnalyzerCustomRule[];
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
  additionalDetectors?: readonly Detector[];
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

export interface AnalyzerDetectorProfile {
  confidence: AnalyzerFindingConfidence;
  contextNote?: string;
  impact: AnalyzerFindingImpact;
}

export type AnalyzerCustomRuleModuleMatchMode = "exact" | "prefix";

export type AnalyzerCustomRuleMatch =
  | {
      kind: "import";
      mode?: AnalyzerCustomRuleModuleMatchMode;
      source: string;
    }
  | {
      callee: string;
      kind: "call";
    };

export interface AnalyzerCustomRule {
  confidence: AnalyzerFindingConfidence;
  contextNote?: string;
  id: string;
  impact: AnalyzerFindingImpact;
  languages?: readonly AnalyzerLanguage[];
  match: AnalyzerCustomRuleMatch;
  message: string;
  rationale: string;
  suggestion: string;
  title: string;
  url?: string;
}

export interface AnalyzerCustomRuleBook {
  $schema?: string;
  formatVersion: 1;
  name: string;
  rules: readonly AnalyzerCustomRule[];
}

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
  ruleRationale?: string;
  ruleTitle?: string;
  ruleUrl?: string;
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
  profile?: AnalyzerDetectorProfile;
  dependencyScope: AnalyzerDetectorDependencyScope;
  id: string;
  ruleId: string;
  languages?: readonly AnalyzerLanguage[];
  analyze: (context: DetectorContext) => readonly AnalyzerFinding[];
}
