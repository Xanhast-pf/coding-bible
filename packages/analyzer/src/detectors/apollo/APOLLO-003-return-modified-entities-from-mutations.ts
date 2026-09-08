import {
  conjunctiveEvidence,
  createSourceEvidenceDetector,
} from "../shared/sourceEvidence.ts";

const detector = createSourceEvidenceDetector({
  id: "apollo_003-evidence",
  ruleId: "APOLLO-003",
  languages: ["graphql"],
  profile: {
    confidence: "contextual",
    impact: "medium",
    contextNote:
      "This detector uses conservative static evidence for APOLLO-003; review surrounding intent before changing behavior.",
  },
  message:
    "Return modified entities from mutations evidence was detected in this source.",
  suggestion: "Apply APOLLO-003: Return modified entities from mutations.",
  find: (context) =>
    conjunctiveEvidence(
      context.source,
      [/\bmutation\s+\w+/m, /\bsuccess\b/m],
      [/\b(?:user|node|item|record)\s*\{/m],
    ),
});

export const apollo003Detectors = [detector];
