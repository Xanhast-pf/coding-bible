import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "a11y_006-evidence",
    ruleId: "A11Y-006",
    languages: ["css"],
    profile: { confidence: "strong", impact: "high" },
    message: "Respect reduced motion preferences evidence was detected in this source.",
    suggestion: "Apply A11Y-006: Respect reduced motion preferences.",
    find: (context) => conjunctiveEvidence(context.source, [/(?:transition|animation|scroll-behavior)\s*:/m, /(?:smooth|\d+m?s)/m], [/prefers-reduced-motion/m]),
});
export const a11y006Detectors = [detector];
