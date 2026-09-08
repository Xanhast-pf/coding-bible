import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "redux_007-evidence",
    ruleId: "REDUX-007",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: {
        confidence: "contextual",
        impact: "low",
        contextNote: "This detector uses conservative static evidence for REDUX-007; review surrounding intent before changing behavior.",
    },
    message: "Memoize selectors only when they derive expensive or referentially new values evidence was detected in this source.",
    suggestion: "Apply REDUX-007: Memoize selectors only when they derive expensive or referentially new values.",
    find: (context) => conjunctiveEvidence(context.source, [
        /\bcreateSelector\s*\(\s*\[\s*\(?\s*state\s*\)?\s*=>\s*state\.([\w.]+)\s*\]\s*,\s*\(?\s*(\w+)\s*\)?\s*=>\s*\2/m,
    ], []),
});
export const redux007Detectors = [detector];
