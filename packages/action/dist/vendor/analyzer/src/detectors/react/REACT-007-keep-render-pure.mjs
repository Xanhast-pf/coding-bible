import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "react_007-evidence",
    ruleId: "REACT-007",
    languages: ["tsx", "jsx"],
    profile: {
        confidence: "contextual",
        impact: "high",
        contextNote: "This detector uses conservative static evidence for REACT-007; review surrounding intent before changing behavior.",
    },
    message: "Keep render pure evidence was detected in this source.",
    suggestion: "Apply REACT-007: Keep render pure.",
    find: (context) => conjunctiveEvidence(context.source, [/\b(?:analytics|telemetry|logger)\.\w+\s*\([^;]*\);[\s\n]*return\s*</m], [/useEffect\s*\(/m]),
});
export const react007Detectors = [detector];
