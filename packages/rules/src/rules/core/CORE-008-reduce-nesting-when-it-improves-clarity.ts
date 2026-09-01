import type { CodingRule } from "../../types";

export const core008Rule = {
  id: "CORE-008",
  title: "Reduce nesting when it improves clarity",
  summary:
    "Prefer guard clauses and early exits when they make the main control flow easier to follow.",
  rationale:
    "Deep nesting increases the amount of state a reader must hold in mind. Early exits can make the successful path visually obvious.",
  level: "prefer",
  pack: "core",
  status: "stable",
  tags: ["clarity", "control-flow"],
  bad: {
    language: "ts",
    code: "if (user) {\n  if (user.active) {\n    save(user);\n  }\n}",
  },
  good: {
    language: "ts",
    code: "if (!user || !user.active) return;\n\nsave(user);",
  },
  exceptions: [
    "Do not introduce multiple early exits when they make cleanup or transactional behavior harder to reason about.",
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
