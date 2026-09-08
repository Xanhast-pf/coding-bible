import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.js";
const detector = createSourceEvidenceDetector({
    id: "flag_004-evidence",
    ruleId: "FLAG-004",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: {
        confidence: "contextual",
        impact: "high",
        contextNote: "This detector uses conservative static evidence for FLAG-004; review surrounding intent before changing behavior.",
    },
    message: "Test both reachable flag states evidence was detected in this source.",
    suggestion: "Apply FLAG-004: Test both reachable flag states.",
    find: (context) => conjunctiveEvidence(context.source, [/\b(?:it|test)\s*\(/m, /setFlag\s*\([^,]+,\s*true\s*\)/m], [/\b(?:it|test)\.each\s*\(/m, /false/m]),
});
export const flag004Detectors = [detector];
