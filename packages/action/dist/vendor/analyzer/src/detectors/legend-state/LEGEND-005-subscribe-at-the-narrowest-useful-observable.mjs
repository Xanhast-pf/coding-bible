import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "legend_005-evidence",
    ruleId: "LEGEND-005",
    languages: ["tsx", "jsx"],
    profile: {
        confidence: "contextual",
        impact: "medium",
        contextNote: "This detector uses conservative static evidence for LEGEND-005; review surrounding intent before changing behavior.",
    },
    message: "Subscribe at the narrowest useful observable evidence was detected in this source.",
    suggestion: "Apply LEGEND-005: Subscribe at the narrowest useful observable.",
    find: (context) => conjunctiveEvidence(context.source, [/\buseValue\s*\(\s*\w+\$\s*\)/m, /\b\w+\.\w+\.\w+/m], []),
});
export const legend005Detectors = [detector];
