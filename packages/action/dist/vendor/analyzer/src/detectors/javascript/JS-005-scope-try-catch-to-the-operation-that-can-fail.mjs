import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "js_005-evidence",
    ruleId: "JS-005",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: {
        confidence: "contextual",
        impact: "medium",
        contextNote: "This detector uses conservative static evidence for JS-005; review surrounding intent before changing behavior.",
    },
    message: "Scope try/catch to the operation that can fail evidence was detected in this source.",
    suggestion: "Apply JS-005: Scope try/catch to the operation that can fail.",
    find: (context) => conjunctiveEvidence(context.source, [
        /\btry\s*\{(?:(?!\}\s*catch)[\s\S])*(?:\bbuild\w*|\brender\w*)\s*\(/m,
    ]),
});
export const js005Detectors = [detector];
