import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.js";
const detector = createSourceEvidenceDetector({
    id: "react_002-evidence",
    ruleId: "REACT-002",
    languages: ["tsx", "jsx", "ts", "js"],
    profile: {
        confidence: "contextual",
        impact: "low",
        contextNote: "This detector uses conservative static evidence for REACT-002; review surrounding intent before changing behavior.",
    },
    message: "Do not memoize by reflex evidence was detected in this source.",
    suggestion: "Apply REACT-002: Do not memoize by reflex.",
    find: (context) => conjunctiveEvidence(context.source, [/\buseMemo\s*\(\s*\(\)\s*=>\s*`[^`$]*\$\{[^}]+\}[^`]*`/m], []),
});
export const react002Detectors = [detector];
