import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "next_002-evidence",
    ruleId: "NEXT-002",
    languages: ["tsx", "jsx"],
    profile: {
        confidence: "contextual",
        impact: "medium",
        contextNote: "This detector uses conservative static evidence for NEXT-002; review surrounding intent before changing behavior.",
    },
    message: "Keep use client boundaries as small as practical evidence was detected in this source.",
    suggestion: "Apply NEXT-002: Keep use client boundaries as small as practical.",
    find: (context) => conjunctiveEvidence(context.source, [/^[\s\n]*["']use client["']\s*;/m, /Large\w+/m], []),
});
export const next002Detectors = [detector];
