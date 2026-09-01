import type { CodingRule } from "../../types";

export const perf003Rule = {
  id: "PERF-003",
  title: "Prefer one pass on hot large-data paths",
  summary:
    "When processing large collections in a hot path, avoid chains that create avoidable intermediate arrays when one clear pass can do the work.",
  rationale:
    "Repeated passes and intermediate allocations scale with dataset size and can become significant in data-heavy applications.",
  level: "prefer",
  pack: "performance",
  status: "stable",
  tags: ["collections", "iteration", "performance"],
  bad: {
    language: "ts",
    code: "const total = rows\n  .filter(isBillable)\n  .map(getAmount)\n  .reduce((sum, amount) => sum + amount, 0);",
  },
  good: {
    language: "ts",
    code: "let total = 0;\nfor (const row of rows) {\n  if (isBillable(row)) {\n    total += getAmount(row);\n  }\n}",
  },
  exceptions: [
    "For small collections or non-hot paths, a readable map/filter chain may be the better engineering choice.",
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
