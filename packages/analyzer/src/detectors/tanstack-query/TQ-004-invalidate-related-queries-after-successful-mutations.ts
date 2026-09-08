import {
  conjunctiveEvidence,
  createSourceEvidenceDetector,
} from "../shared/sourceEvidence.ts";

const detector = createSourceEvidenceDetector({
  id: "tq_004-evidence",
  ruleId: "TQ-004",
  languages: ["tsx", "ts", "jsx", "js"],
  profile: {
    confidence: "contextual",
    impact: "high",
    contextNote:
      "This detector uses conservative static evidence for TQ-004; review surrounding intent before changing behavior.",
  },
  message:
    "Invalidate related queries after successful mutations evidence was detected in this source.",
  suggestion:
    "Apply TQ-004: Invalidate related queries after successful mutations.",
  find: (context) =>
    conjunctiveEvidence(
      context.source,
      [/\buseMutation\s*\(\s*\{[\s\S]*mutationFn\s*:/m],
      [/\bonSuccess\s*:/m, /\bonSettled\s*:/m],
    ),
});

export const tq004Detectors = [detector];
