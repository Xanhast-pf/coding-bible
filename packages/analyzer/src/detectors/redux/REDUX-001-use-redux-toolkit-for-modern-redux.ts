import {
  conjunctiveEvidence,
  createSourceEvidenceDetector,
} from "../shared/sourceEvidence.ts";

const detector = createSourceEvidenceDetector({
  id: "redux_001-evidence",
  ruleId: "REDUX-001",
  languages: ["ts", "tsx", "js", "jsx"],
  profile: { confidence: "strong", impact: "medium" },
  message:
    "Use Redux Toolkit for modern Redux evidence was detected in this source.",
  suggestion: "Apply REDUX-001: Use Redux Toolkit for modern Redux.",
  find: (context) =>
    conjunctiveEvidence(
      context.source,
      [/\bswitch\s*\(\s*action\.type\s*\)/m, /\bcase\s+["']/m],
      [/createSlice\s*\(/m],
    ),
});

export const redux001Detectors = [detector];
