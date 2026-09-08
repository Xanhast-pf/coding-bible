import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "apollo_006-evidence",
    ruleId: "APOLLO-006",
    languages: ["tsx", "ts", "jsx", "js"],
    profile: {
        confidence: "contextual",
        impact: "high",
        contextNote: "This detector uses conservative static evidence for APOLLO-006; review surrounding intent before changing behavior.",
    },
    message: "Handle GraphQL errors and partial data intentionally evidence was detected in this source.",
    suggestion: "Apply APOLLO-006: Handle GraphQL errors and partial data intentionally.",
    find: (context) => conjunctiveEvidence(context.source, [/\buseQuery\s*\(/m, /errorPolicy\s*:\s*["']ignore["']/m], []),
});
export const apollo006Detectors = [detector];
