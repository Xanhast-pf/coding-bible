import type { CodingRule } from "../../types";

export const ai003Rule = {
  id: "AI-003",
  title: "Change the smallest coherent surface",
  summary:
    "Do not expand generated changes into unrelated cleanup or speculative refactors.",
  rationale:
    "Small coherent diffs are easier to validate, review, revert, and debug.",
  level: "should",
  pack: "ai",
  status: "stable",
  tags: ["ai", "review", "scope"],
  bad: {
    language: "text",
    code: "Requested: Fix invoice rounding\n\nGenerated diff:\n- Fix invoice rounding\n- Rename money utilities\n- Move billing folders\n- Reformat unrelated tests",
  },
  good: {
    language: "text",
    code: "Requested: Fix invoice rounding\n\nGenerated diff:\n- Fix invoice rounding\n- Add the regression test",
  },
  detection: { autoFixable: false, detectable: false },
} satisfies CodingRule;
