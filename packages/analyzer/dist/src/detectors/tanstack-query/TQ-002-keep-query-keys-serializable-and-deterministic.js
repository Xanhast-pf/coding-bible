import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.js";
const detector = createSourceEvidenceDetector({
    id: "tq_002-evidence",
    ruleId: "TQ-002",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: { confidence: "strong", impact: "high" },
    message: "Keep query keys serializable and deterministic evidence was detected in this source.",
    suggestion: "Apply TQ-002: Keep query keys serializable and deterministic.",
    find: (context) => conjunctiveEvidence(context.source, [/\bqueryKey\s*=\s*\[[^\]]*(?:=>|function\b)/m], []),
});
export const tq002Detectors = [detector];
