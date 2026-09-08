import {
  conjunctiveEvidence,
  createSourceEvidenceDetector,
} from "../shared/sourceEvidence.ts";

const detector = createSourceEvidenceDetector({
  id: "flag_002-evidence",
  ruleId: "FLAG-002",
  languages: ["ts", "tsx", "js", "jsx"],
  profile: {
    confidence: "contextual",
    impact: "high",
    contextNote:
      "This detector uses conservative static evidence for FLAG-002; review surrounding intent before changing behavior.",
  },
  message: "Delete flags after rollout evidence was detected in this source.",
  suggestion: "Apply FLAG-002: Delete flags after rollout.",
  find: (context) =>
    conjunctiveEvidence(
      context.source,
      [/\bflags?\.\w+/m, /\brender(?:New|Legacy)\w*\s*\(/m],
      [],
    ),
});

export const flag002Detectors = [detector];
