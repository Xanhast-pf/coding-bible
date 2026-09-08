import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "gql_005-evidence",
    ruleId: "GQL-005",
    languages: ["ts", "tsx"],
    profile: {
        confidence: "contextual",
        impact: "high",
        contextNote: "This detector uses conservative static evidence for GQL-005; review surrounding intent before changing behavior.",
    },
    message: "Treat nullability as part of the contract evidence was detected in this source.",
    suggestion: "Apply GQL-005: Treat nullability as part of the contract.",
    find: (context) => conjunctiveEvidence(context.source, [/\/\/\s*Schema:\s*(\w+)\s*:\s*String\b[\s\S]*\b\1\s*:\s*string\b/m], [/\bstring\s*\|\s*null\b/m]),
});
export const gql005Detectors = [detector];
