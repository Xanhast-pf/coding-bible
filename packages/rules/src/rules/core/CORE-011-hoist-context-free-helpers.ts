import type { CodingRule } from "../../types";

export const core011Rule = {
  id: "CORE-011",
  title: "Hoist context-free helpers",
  summary:
    "If a helper does not depend on its parent function's local values, define it in a stable outer scope.",
  rationale:
    "Hoisting communicates independence, avoids needless recreation, and makes the helper easier to test or reuse locally.",
  level: "prefer",
  pack: "core",
  status: "stable",
  tags: ["functions", "scope"],
  bad: {
    language: "ts",
    code: "export const buildReport = (rows: Row[]) => {\n  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;\n\n  return rows.map((row) => formatCurrency(row.total));\n};",
  },
  good: {
    language: "ts",
    code: "const formatCurrency = (value: number) => `$${value.toFixed(2)}`;\n\nexport const buildReport = (rows: Row[]) =>\n  rows.map((row) => formatCurrency(row.total));",
  },
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
