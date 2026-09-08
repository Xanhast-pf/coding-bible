import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.js";
const detector = createSourceEvidenceDetector({
    id: "redux_004-evidence",
    ruleId: "REDUX-004",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: {
        confidence: "contextual",
        impact: "high",
        contextNote: "This detector uses conservative static evidence for REDUX-004; review surrounding intent before changing behavior.",
    },
    message: "Keep Redux state minimal and derive the rest evidence was detected in this source.",
    suggestion: "Apply REDUX-004: Keep Redux state minimal and derive the rest.",
    find: (context) => conjunctiveEvidence(context.source, [
        /\b(?:initialState|state)\s*=\s*\{[^}]*\btodos\s*:\s*\[[^\]]*\][^}]*\bvisibleTodos\s*:/m,
    ], []),
});
export const redux004Detectors = [detector];
