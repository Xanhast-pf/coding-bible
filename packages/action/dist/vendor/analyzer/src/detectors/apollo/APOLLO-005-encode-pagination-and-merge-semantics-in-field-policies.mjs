import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "apollo_005-evidence",
    ruleId: "APOLLO-005",
    languages: ["tsx", "ts", "jsx", "js"],
    profile: {
        confidence: "contextual",
        impact: "medium",
        contextNote: "This detector uses conservative static evidence for APOLLO-005; review surrounding intent before changing behavior.",
    },
    message: "Encode pagination and merge semantics in field policies evidence was detected in this source.",
    suggestion: "Apply APOLLO-005: Encode pagination and merge semantics in field policies.",
    find: (context) => conjunctiveEvidence(context.source, [/\bfetchMore\s*\(/m, /\bset\w*\s*\(/m, /\.data\.\w+/m], []),
});
export const apollo005Detectors = [detector];
