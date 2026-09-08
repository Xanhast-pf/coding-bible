import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.js";
const detector = createSourceEvidenceDetector({
    id: "ts_005-evidence",
    ruleId: "TS-005",
    languages: ["ts", "tsx"],
    profile: {
        confidence: "contextual",
        impact: "high",
        contextNote: "This detector uses conservative static evidence for TS-005; review surrounding intent before changing behavior.",
    },
    message: "Optional means genuinely optional evidence was detected in this source.",
    suggestion: "Apply TS-005: Optional means genuinely optional.",
    find: (context) => conjunctiveEvidence(context.source, [/\binterface\s+\w+\s*\{[\s\S]*\bid\?\s*:[^;}]+;[\s\S]*\bemail\?\s*:/m], []),
});
export const ts005Detectors = [detector];
