import {
  conjunctiveEvidence,
  createSourceEvidenceDetector,
} from "../shared/sourceEvidence.ts";

const detector = createSourceEvidenceDetector({
  id: "a11y_005-evidence",
  ruleId: "A11Y-005",
  languages: ["tsx", "jsx"],
  profile: {
    confidence: "contextual",
    impact: "high",
    contextNote:
      "This detector uses conservative static evidence for A11Y-005; review surrounding intent before changing behavior.",
  },
  message:
    "Do not communicate with color alone evidence was detected in this source.",
  suggestion: "Apply A11Y-005: Do not communicate with color alone.",
  find: (context) =>
    conjunctiveEvidence(
      context.source,
      [
        /className\s*=\s*\{[^}]*\?[^:}]*(?:[Rr]ed|[Gg]reen)[^:}]*:[^}]*(?:[Rr]ed|[Gg]reen)/m,
        />\s*●\s*</m,
      ],
      [/aria-hidden/m, /["'](?:Overdue|On time)["']/m],
    ),
});

export const a11y005Detectors = [detector];
