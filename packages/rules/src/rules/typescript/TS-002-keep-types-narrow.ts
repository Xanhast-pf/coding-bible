import type { CodingRule } from "../../types";

export const ts002Rule = {
  id: "TS-002",
  title: "Keep types narrow",
  summary: "Model only states the runtime contract genuinely permits.",
  rationale:
    "Broad unions and unnecessary optional properties force consumers to handle states that cannot occur.",
  level: "must",
  pack: "typescript",
  status: "stable",
  tags: ["safety", "types"],
  bad: { language: "ts", code: "type Status = string;" },
  good: {
    language: "ts",
    code: 'type Status = "active" | "paused";',
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
