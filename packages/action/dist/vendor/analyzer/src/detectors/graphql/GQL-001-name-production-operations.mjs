import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "gql_001-evidence",
    ruleId: "GQL-001",
    languages: ["graphql"],
    profile: { confidence: "strong", impact: "high" },
    message: "Name production operations evidence was detected in this source.",
    suggestion: "Apply GQL-001: Name production operations.",
    find: (context) => conjunctiveEvidence(context.source, [/\b(?:query|mutation|subscription)\s*\{/m], []),
});
export const gql001Detectors = [detector];
