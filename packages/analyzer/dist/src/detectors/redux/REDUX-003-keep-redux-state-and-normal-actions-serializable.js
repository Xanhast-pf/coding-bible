import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.js";
const detector = createSourceEvidenceDetector({
    id: "redux_003-evidence",
    ruleId: "REDUX-003",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: { confidence: "strong", impact: "high" },
    message: "Keep Redux state and normal actions serializable evidence was detected in this source.",
    suggestion: "Apply REDUX-003: Keep Redux state and normal actions serializable.",
    find: (context) => conjunctiveEvidence(context.source, [/\bdispatch\s*\([\s\S]*new\s+Date\s*\(\s*\)/m], [/\.toISOString\s*\(/m]),
});
export const redux003Detectors = [detector];
