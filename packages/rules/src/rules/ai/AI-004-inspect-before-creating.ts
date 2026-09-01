import type { CodingRule } from "../../types";

export const ai004Rule = {
  id: "AI-004",
  title: "Inspect before creating",
  summary:
    "Before generating a new helper, component, type, dependency, or pattern, search for an existing solution in the project.",
  rationale:
    "Agents can generate locally correct duplicates because they do not automatically share a human maintainer's memory of the codebase.",
  level: "must",
  pack: "ai",
  status: "stable",
  tags: ["ai", "duplication", "reuse"],
  bad: {
    language: "ts",
    code: "// New duplicate helper.\nconst formatCurrency = (value: number) =>\n  `$${value.toFixed(2)}`;",
  },
  good: {
    language: "ts",
    code: 'import { formatCurrency } from "@/shared/currency";\n\nconst label = formatCurrency(total);',
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
