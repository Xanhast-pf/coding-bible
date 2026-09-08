import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.js";
const detector = createSourceEvidenceDetector({
    id: "i18n_002-evidence",
    ruleId: "I18N-002",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: {
        confidence: "contextual",
        impact: "high",
        contextNote: "This detector uses conservative static evidence for I18N-002; review surrounding intent before changing behavior.",
    },
    message: "Parameterize messages instead of concatenating sentences evidence was detected in this source.",
    suggestion: "Apply I18N-002: Parameterize messages instead of concatenating sentences.",
    find: (context) => conjunctiveEvidence(context.source, [/["'][^"']+["']\s*\+\s*\w+\s*\+/m, /\?\s*["'][^"']+["']\s*:\s*["']/m], []),
});
export const i18n002Detectors = [detector];
