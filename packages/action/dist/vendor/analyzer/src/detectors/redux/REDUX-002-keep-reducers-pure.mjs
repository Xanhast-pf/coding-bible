import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "redux_002-evidence",
    ruleId: "REDUX-002",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: {
        confidence: "contextual",
        impact: "high",
        contextNote: "This detector uses conservative static evidence for REDUX-002; review surrounding intent before changing behavior.",
    },
    message: "Keep reducers pure evidence was detected in this source.",
    suggestion: "Apply REDUX-002: Keep reducers pure.",
    find: (context) => conjunctiveEvidence(context.source, [/\b\w+\s*\(\s*state\s*\)\s*\{[\s\S]*Date\.now\s*\(/m], []),
});
export const redux002Detectors = [detector];
