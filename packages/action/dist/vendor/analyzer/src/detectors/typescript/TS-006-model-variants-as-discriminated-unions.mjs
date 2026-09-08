import { conjunctiveEvidence, createSourceEvidenceDetector, } from "../shared/sourceEvidence.mjs";
const detector = createSourceEvidenceDetector({
    id: "ts_006-evidence",
    ruleId: "TS-006",
    languages: ["ts", "tsx"],
    profile: {
        confidence: "contextual",
        impact: "low",
        contextNote: "This detector uses conservative static evidence for TS-006; review surrounding intent before changing behavior.",
    },
    message: "Model variants as discriminated unions evidence was detected in this source.",
    suggestion: "Apply TS-006: Model variants as discriminated unions.",
    find: (context) => conjunctiveEvidence(context.source, [
        /\binterface\s+\w*(?:State|Result|Response)\w*\s*\{[\s\S]*\bisLoading\s*:\s*boolean[\s\S]*\b(?:error|data)\?\s*:/m,
    ], []),
});
export const ts006Detectors = [detector];
