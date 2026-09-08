import {
  conjunctiveEvidence,
  createSourceEvidenceDetector,
} from "../shared/sourceEvidence.ts";

const detector = createSourceEvidenceDetector({
  id: "redux_005-evidence",
  ruleId: "REDUX-005",
  languages: ["ts", "tsx", "js", "jsx"],
  profile: {
    confidence: "contextual",
    impact: "medium",
    contextNote:
      "This detector uses conservative static evidence for REDUX-005; review surrounding intent before changing behavior.",
  },
  message:
    "Normalize complex relational collections evidence was detected in this source.",
  suggestion: "Apply REDUX-005: Normalize complex relational collections.",
  find: (context) =>
    conjunctiveEvidence(
      context.source,
      [
        /\bauthor\s*:\s*\{\s*id\s*:[^}]+name\s*:/m,
        /\bauthor\s*:\s*\{\s*id\s*:/m,
      ],
      [/authorId\s*:/m],
    ),
});

export const redux005Detectors = [detector];
