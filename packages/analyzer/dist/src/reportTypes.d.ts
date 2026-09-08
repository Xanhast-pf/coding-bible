import type { AnalyzerFindingConfidence, AnalyzerFindingImpact, AnalyzerFixSafety, AnalyzerRuleSetting, SourceLocation } from "./types.js";
export type AnalyzerReportLocation = SourceLocation;
export interface AnalyzerReportDiagnosticV1 {
    excerpt: string;
    file: string;
    location: AnalyzerReportLocation;
    message: string;
}
export interface AnalyzerReportFixV1 {
    available: boolean;
    description?: string;
    patch?: string | null;
    safety: AnalyzerFixSafety | "none";
    title?: string;
}
export interface AnalyzerReportFindingV1 {
    confidence: AnalyzerFindingConfidence;
    contextNote: string | null;
    detectorId: string;
    excerpt: string;
    file: string;
    fingerprint: string;
    fix: AnalyzerReportFixV1;
    impact: AnalyzerFindingImpact;
    location: AnalyzerReportLocation;
    message: string;
    ruleId: string;
    ruleRationale: string | null;
    ruleTitle: string | null;
    ruleUrl: string | null;
    severity: Exclude<AnalyzerRuleSetting, "off">;
    suggestion: string;
}
export interface AnalyzerReportSummaryV1 {
    baselineSuppressed: number;
    cacheHits: number;
    cacheMisses: number;
    diagnostics: number;
    errors: number;
    filesDiscovered: number;
    filesAnalyzed: number;
    findings: number;
    reviewFixes: number;
    rulesChecked: number;
    safeFixes: number;
    warnings: number;
    confidence: Readonly<Record<AnalyzerFindingConfidence, number>>;
    impact: Readonly<Record<AnalyzerFindingImpact, number>>;
}
/**
 * Common, runtime-independent portion of Coding Bible analyzer report v1.
 * CLI and browser reports may add runtime-specific top-level metadata, but
 * diagnostics, findings, and summary fields must preserve this contract.
 */
export interface AnalyzerReportV1 {
    schemaVersion: 1;
    summary: AnalyzerReportSummaryV1;
    diagnostics: readonly AnalyzerReportDiagnosticV1[];
    findings: readonly AnalyzerReportFindingV1[];
    [key: string]: unknown;
}
