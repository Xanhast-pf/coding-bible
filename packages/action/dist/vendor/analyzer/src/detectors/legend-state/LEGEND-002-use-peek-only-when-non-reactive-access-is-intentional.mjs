import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "legend_002-evidence",
    ruleId: "LEGEND-002",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: {
        confidence: "contextual",
        impact: "high",
        contextNote: "This detector uses conservative static evidence for LEGEND-002; review surrounding intent before changing behavior.",
    },
    message: "Use peek only when non-reactive access is intentional evidence was detected in this source.",
    suggestion: "Apply LEGEND-002: Use peek only when non-reactive access is intentional.",
    find: (context) => conjunctiveEvidence(context.source, [
        /\$\.\w+(?:\.\w+)*\.get\s*\(\s*\)/m,
        /\b(?:analytics|logger|console|telemetry)\.\w+\s*\(/m,
    ], []),
});
export const legend002Detectors = [detector];
