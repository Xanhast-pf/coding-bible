import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.js";
const detector = createSourceEvidenceDetector({
    id: "legend_003-evidence",
    ruleId: "LEGEND-003",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: { confidence: "strong", impact: "high" },
    message: "Update observable state through observable APIs evidence was detected in this source.",
    suggestion: "Apply LEGEND-003: Update observable state through observable APIs.",
    find: (context) => conjunctiveEvidence(context.source, [/\bconst\s+(\w+)\s*=\s*[^;]+\.peek\s*\(\s*\)\s*;[\s\S]*\b\1\.\w+\s*=/m], []),
});
export const legend003Detectors = [detector];
