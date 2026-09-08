import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "next_005-evidence",
    ruleId: "NEXT-005",
    languages: ["tsx", "jsx"],
    profile: { confidence: "strong", impact: "medium" },
    message: "Fetch server data directly from Server Components evidence was detected in this source.",
    suggestion: "Apply NEXT-005: Fetch server data directly from Server Components.",
    find: (context) => conjunctiveEvidence(context.source, [
        /export\s+default\s+async\s+function/m,
        /fetch\s*\(\s*["']https?:\/\/[^"']+\/api\//m,
    ], []),
});
export const next005Detectors = [detector];
