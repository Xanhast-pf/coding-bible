import {
  conjunctiveEvidence,
  createSourceEvidenceDetector,
} from "../shared/sourceEvidence.ts";

const detector = createSourceEvidenceDetector({
  id: "next_001-evidence",
  ruleId: "NEXT-001",
  languages: ["tsx", "jsx"],
  profile: {
    confidence: "contextual",
    impact: "medium",
    contextNote:
      "This detector uses conservative static evidence for NEXT-001; review surrounding intent before changing behavior.",
  },
  message: "Default to Server Components evidence was detected in this source.",
  suggestion: "Apply NEXT-001: Default to Server Components.",
  find: (context) =>
    conjunctiveEvidence(
      context.source,
      [/^[\s\n]*["']use client["']\s*;/m, /\buseEffect\s*\(/m, /fetch\s*\(/m],
      [],
    ),
});

export const next001Detectors = [detector];
