import type { CodingRule } from "../../types";

export const js007Rule = {
  id: "JS-007",
  title: "Use an options object when positional parameters stop being obvious",
  summary:
    "When a function has several same-shaped or optional arguments, prefer one named options object over a long positional signature.",
  rationale:
    "Named arguments make call sites self-documenting and allow the API to evolve without argument-order traps.",
  level: "prefer",
  pack: "javascript",
  status: "stable",
  tags: ["api-design", "functions", "parameters"],
  bad: {
    language: "ts",
    code: 'createReport(data, true, 50, false, "USD");',
  },
  good: {
    language: "ts",
    code: 'createReport({ data, currency: "USD", includeDrafts: true, limit: 50 });',
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
