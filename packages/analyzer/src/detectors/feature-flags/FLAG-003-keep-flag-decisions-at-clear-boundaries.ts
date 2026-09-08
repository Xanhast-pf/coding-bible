import {
  conjunctiveEvidence,
  createSourceEvidenceDetector,
} from "../shared/sourceEvidence.ts";

const detector = createSourceEvidenceDetector({
  id: "flag_003-evidence",
  ruleId: "FLAG-003",
  languages: ["ts", "tsx", "js", "jsx"],
  profile: {
    confidence: "contextual",
    impact: "medium",
    contextNote:
      "This detector uses conservative static evidence for FLAG-003; review surrounding intent before changing behavior.",
  },
  message:
    "Keep flag decisions at clear boundaries evidence was detected in this source.",
  suggestion: "Apply FLAG-003: Keep flag decisions at clear boundaries.",
  find: (context) =>
    conjunctiveEvidence(
      context.source,
      [/flags?\.(\w+)[^;]+\?[^;]+:[^;]+;[\s\S]*flags?\.\1[^;]+\?[^;]+:[^;]+;/m],
      [],
    ),
});

export const flag003Detectors = [detector];
