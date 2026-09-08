import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "a11y_003-evidence",
    ruleId: "A11Y-003",
    languages: ["css"],
    profile: { confidence: "strong", impact: "high" },
    message: "Keep focus visible evidence was detected in this source.",
    suggestion: "Apply A11Y-003: Keep focus visible.",
    find: (context) => conjunctiveEvidence(context.source, [/:focus(?!-visible)[^{]*\{[^}]*outline\s*:\s*(?:none|0)\b/m], []),
});
export const a11y003Detectors = [detector];
