import type { AnalyzerFinding, DetectorContext } from "../../types.js";
export declare const core010Detectors: {
    dependencyScope: "project";
    id: string;
    ruleId: string;
    languages: ("tsx" | "ts" | "jsx" | "js")[];
    profile: {
        confidence: "strong";
        impact: "medium";
        contextNote: string;
    };
    analyze: (context: DetectorContext) => readonly AnalyzerFinding[];
}[];
