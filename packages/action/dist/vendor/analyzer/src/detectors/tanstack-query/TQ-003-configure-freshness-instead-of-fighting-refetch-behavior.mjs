import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "tq_003-evidence",
    ruleId: "TQ-003",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: {
        confidence: "contextual",
        impact: "medium",
        contextNote: "This detector uses conservative static evidence for TQ-003; review surrounding intent before changing behavior.",
    },
    message: "Configure freshness instead of fighting refetch behavior evidence was detected in this source.",
    suggestion: "Apply TQ-003: Configure freshness instead of fighting refetch behavior.",
    find: (context) => conjunctiveEvidence(context.source, [
        /new\s+QueryClient\s*\(/m,
        /refetchOnMount\s*:\s*false/m,
        /refetchOnReconnect\s*:\s*false/m,
        /refetchOnWindowFocus\s*:\s*false/m,
    ], []),
});
export const tq003Detectors = [detector];
