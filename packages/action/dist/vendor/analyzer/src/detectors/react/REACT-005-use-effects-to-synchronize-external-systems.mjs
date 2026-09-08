import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "react_005-evidence",
    ruleId: "REACT-005",
    languages: ["tsx", "jsx", "ts", "js"],
    profile: {
        confidence: "contextual",
        impact: "medium",
        contextNote: "This detector uses conservative static evidence for REACT-005; review surrounding intent before changing behavior.",
    },
    message: "Use effects to synchronize external systems evidence was detected in this source.",
    suggestion: "Apply REACT-005: Use effects to synchronize external systems.",
    find: (context) => conjunctiveEvidence(context.source, [
        /\buseEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*if\s*\([^)]*should\w*\)[\s\S]*\b\w+\s*\(/m,
    ], []),
});
export const react005Detectors = [detector];
