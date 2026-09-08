import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.js";
const detector = createSourceEvidenceDetector({
    id: "test_005-evidence",
    ruleId: "TEST-005",
    languages: ["tsx", "ts", "jsx", "js"],
    profile: {
        confidence: "contextual",
        impact: "low",
        contextNote: "This detector uses conservative static evidence for TEST-005; review surrounding intent before changing behavior.",
    },
    message: "Use snapshots selectively evidence was detected in this source.",
    suggestion: "Apply TEST-005: Use snapshots selectively.",
    find: (context) => conjunctiveEvidence(context.source, [/\bexpect\s*\([^)]*\)\.toMatchSnapshot\s*\(\s*\)/m], []),
});
export const test005Detectors = [detector];
