import type { AnalyzerDetectorProfile, AnalyzerLanguage, Detector, DetectorContext } from "../../types.js";
export interface SourceEvidence {
    end: number;
    message?: string;
    start: number;
}
export interface SourceEvidenceDetectorOptions {
    dependencyScope?: "project" | "source-file";
    find: (context: DetectorContext) => readonly SourceEvidence[];
    id: string;
    languages: readonly AnalyzerLanguage[];
    message: string;
    profile: AnalyzerDetectorProfile;
    ruleId: string;
    suggestion: string;
}
export declare const evidenceFromRegex: (source: string, pattern: RegExp) => readonly SourceEvidence[];
export declare const firstEvidence: (source: string, pattern: RegExp) => readonly SourceEvidence[];
export declare const createSourceEvidenceDetector: (options: SourceEvidenceDetectorOptions) => Detector;
export declare const conjunctiveEvidence: (source: string, required: readonly RegExp[], forbidden?: readonly RegExp[]) => readonly SourceEvidence[];
