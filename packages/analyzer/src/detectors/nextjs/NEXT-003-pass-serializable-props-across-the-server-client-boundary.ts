import { createSourceEvidenceDetector } from "../shared/sourceEvidence.ts";

const detector = createSourceEvidenceDetector({
  id: "next_003-evidence",
  ruleId: "NEXT-003",
  languages: ["tsx", "jsx"],
  profile: { confidence: "strong", impact: "high" },
  message:
    "Pass serializable props across the server-client boundary evidence was detected in this source.",
  suggestion:
    "Apply NEXT-003: Pass serializable props across the server-client boundary.",
  find: (context) => {
    if (/["']use client["']/.test(context.source)) return [];
    const match =
      /\/\/\s*Server Component[\s\S]*?const\s+(\w+)\s*=\s*\([^)]*\)\s*=>[\s\S]*?<\w+[^>]*\b\w+\s*=\s*\{\s*\1\s*\}/m.exec(
        context.source,
      );
    if (!match) return [];
    const start = match.index;
    return [{ start, end: start + match[0].length }];
  },
});

export const next003Detectors = [detector];
