import type { CodingRule } from "../../types";

export const core009Rule = {
  id: "CORE-009",
  title: "Preserve non-obvious context during refactors",
  summary:
    "When moving code, preserve explanations and constraints that remain relevant to the behavior.",
  rationale:
    "Refactors should change structure without silently deleting historical context that future maintainers still need.",
  level: "must",
  pack: "core",
  status: "stable",
  tags: ["comments", "refactoring"],
  bad: {
    language: "ts",
    code: "const MAX_PAYMENT_RETRIES = 2;\n\nexport const retryPayment = () => { /* ... */ };",
  },
  good: {
    language: "ts",
    code: "// Gateway may duplicate charges after 2 retries; see PAY-1842.\nconst MAX_PAYMENT_RETRIES = 2;\n\nexport const retryPayment = () => { /* ... */ };",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
