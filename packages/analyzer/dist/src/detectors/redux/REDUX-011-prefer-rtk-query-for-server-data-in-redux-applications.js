import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.js";
const detector = createSourceEvidenceDetector({
    id: "redux_011-evidence",
    ruleId: "REDUX-011",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: {
        confidence: "contextual",
        impact: "medium",
        contextNote: "This detector uses conservative static evidence for REDUX-011; review surrounding intent before changing behavior.",
    },
    message: "Prefer RTK Query for server data in Redux applications evidence was detected in this source.",
    suggestion: "Apply REDUX-011: Prefer RTK Query for server data in Redux applications.",
    find: (context) => conjunctiveEvidence(context.source, [/\bcreateAsyncThunk\s*\(/m, /(?:fetch|load|get)\w*/m], [/createApi\s*\(/m]),
});
export const redux011Detectors = [detector];
