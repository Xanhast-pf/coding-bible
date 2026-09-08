import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.js";
const detector = createSourceEvidenceDetector({
    id: "ts_002-evidence",
    ruleId: "TS-002",
    languages: ["ts", "tsx"],
    profile: {
        confidence: "contextual",
        impact: "high",
        contextNote: "This detector uses conservative static evidence for TS-002; review surrounding intent before changing behavior.",
    },
    message: "Keep types narrow evidence was detected in this source.",
    suggestion: "Apply TS-002: Keep types narrow.",
    find: (context) => conjunctiveEvidence(context.source, [/\btype\s+\w+\s*=\s*string\s*;/m], []),
});
export const ts002Detectors = [detector];
