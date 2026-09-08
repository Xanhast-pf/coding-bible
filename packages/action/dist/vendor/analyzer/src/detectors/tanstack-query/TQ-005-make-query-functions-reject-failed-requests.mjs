import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "tq_005-evidence",
    ruleId: "TQ-005",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: { confidence: "strong", impact: "high" },
    message: "Make query functions reject failed requests evidence was detected in this source.",
    suggestion: "Apply TQ-005: Make query functions reject failed requests.",
    find: (context) => conjunctiveEvidence(context.source, [/\bfetch\s*\(/m, /return\s+\w+\.json\s*\(\s*\)/m], [/\.ok\b/m, /throw\s+new\s+Error/m]),
});
export const tq005Detectors = [detector];
