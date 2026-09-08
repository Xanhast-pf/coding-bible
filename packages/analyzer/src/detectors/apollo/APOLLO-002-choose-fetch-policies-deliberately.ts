import {
  conjunctiveEvidence,
  createSourceEvidenceDetector,
} from "../shared/sourceEvidence.ts";

const detector = createSourceEvidenceDetector({
  id: "apollo_002-evidence",
  ruleId: "APOLLO-002",
  languages: ["ts", "tsx", "js", "jsx"],
  profile: {
    confidence: "contextual",
    impact: "medium",
    contextNote:
      "This detector uses conservative static evidence for APOLLO-002; review surrounding intent before changing behavior.",
  },
  message:
    "Choose fetch policies deliberately evidence was detected in this source.",
  suggestion: "Apply APOLLO-002: Choose fetch policies deliberately.",
  find: (context) =>
    conjunctiveEvidence(
      context.source,
      [
        /new\s+ApolloClient\s*\(/m,
        /defaultOptions\s*:/m,
        /watchQuery\s*:/m,
        /fetchPolicy\s*:\s*["']network-only["']/m,
      ],
      [],
    ),
});

export const apollo002Detectors = [detector];
