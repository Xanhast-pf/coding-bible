import type { AnalyzerFindingConfidence, AnalyzerFindingImpact } from "./types.js";
export interface AnalyzerFindingProfile {
    confidence: AnalyzerFindingConfidence;
    contextNote?: string;
    impact: AnalyzerFindingImpact;
}
export declare const analyzerFindingProfiles: Readonly<Record<string, AnalyzerFindingProfile>>;
export declare const analyzerFindingProfileSignature: string;
export declare const getAnalyzerFindingProfile: (detectorId: string) => AnalyzerFindingProfile | undefined;
