import {
  conjunctiveEvidence,
  createSourceEvidenceDetector,
} from "../shared/sourceEvidence.ts";

const detector = createSourceEvidenceDetector({
  id: "legend_006-evidence",
  ruleId: "LEGEND-006",
  languages: ["ts", "tsx", "js", "jsx"],
  profile: { confidence: "strong", impact: "high" },
  message:
    "Keep persisted or synchronized state serializable evidence was detected in this source.",
  suggestion:
    "Apply LEGEND-006: Keep persisted or synchronized state serializable.",
  find: (context) =>
    conjunctiveEvidence(
      context.source,
      [
        /\$\.\w+(?:\.\w+)*\.set\s*\(\s*\{[\s\S]*(?:new\s+Date\s*\(|:\s*\w+(?:Session|Handler|Callback)\b)/m,
      ],
      [/\.toISOString\s*\(/m],
    ),
});

export const legend006Detectors = [detector];
