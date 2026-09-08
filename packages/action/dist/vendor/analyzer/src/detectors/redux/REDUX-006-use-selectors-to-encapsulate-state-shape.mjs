import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "redux_006-evidence",
    ruleId: "REDUX-006",
    languages: ["tsx", "ts", "jsx", "js"],
    profile: {
        confidence: "contextual",
        impact: "medium",
        contextNote: "This detector uses conservative static evidence for REDUX-006; review surrounding intent before changing behavior.",
    },
    message: "Use selectors to encapsulate state shape evidence was detected in this source.",
    suggestion: "Apply REDUX-006: Use selectors to encapsulate state shape.",
    find: (context) => conjunctiveEvidence(context.source, [/\buseSelector\s*\(\s*\(?\s*state\s*\)?\s*=>\s*state\.\w+\.\w+\.\w+/m], []),
});
export const redux006Detectors = [detector];
