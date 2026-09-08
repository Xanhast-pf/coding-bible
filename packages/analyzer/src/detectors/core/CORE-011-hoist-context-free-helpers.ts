import {
  conjunctiveEvidence,
  createSourceEvidenceDetector,
} from "../shared/sourceEvidence.ts";

const detector = createSourceEvidenceDetector({
  id: "core_011-evidence",
  ruleId: "CORE-011",
  languages: ["ts", "tsx", "js", "jsx"],
  profile: {
    confidence: "contextual",
    impact: "low",
    contextNote:
      "This detector uses conservative static evidence for CORE-011; review surrounding intent before changing behavior.",
  },
  message: "Hoist context-free helpers evidence was detected in this source.",
  suggestion: "Apply CORE-011: Hoist context-free helpers.",
  find: (context) =>
    conjunctiveEvidence(
      context.source,
      [
        /export\s+const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{\s*const\s+\w+\s*=\s*\([^)]*\)\s*=>/m,
      ],
      [],
    ),
});

export const core011Detectors = [detector];
