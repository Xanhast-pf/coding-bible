import {
  conjunctiveEvidence,
  createSourceEvidenceDetector,
} from "../shared/sourceEvidence.ts";

const detector = createSourceEvidenceDetector({
  id: "gql_003-evidence",
  ruleId: "GQL-003",
  languages: ["graphql"],
  profile: {
    confidence: "contextual",
    impact: "medium",
    contextNote:
      "This detector uses conservative static evidence for GQL-003; review surrounding intent before changing behavior.",
  },
  message:
    "Use fragments for genuinely shared selection sets evidence was detected in this source.",
  suggestion:
    "Apply GQL-003: Use fragments for genuinely shared selection sets.",
  find: (context) =>
    conjunctiveEvidence(
      context.source,
      [
        /\b(\w+)\s*\{\s*id\s+name\s+avatarUrl\s*\}[\s\S]*\b(?!\1)(\w+)\s*\{\s*id\s+name\s+avatarUrl\s*\}/m,
      ],
      [/\bfragment\b/m],
    ),
});

export const gql003Detectors = [detector];
