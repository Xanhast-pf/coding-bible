import type { CodingRule } from "../../types";

export const work002Rule = {
  id: "WORK-002",
  title: "Keep changes scoped",
  summary:
    "Avoid mixing unrelated refactors, folder moves, migrations, cleanup, and behavior changes in one change unless the coupling is explicit and necessary.",
  rationale:
    "Focused diffs are easier to review, test, revert, and attribute when regressions occur.",
  level: "should",
  pack: "workflow",
  status: "stable",
  tags: ["pull-requests", "review", "scope"],
  bad: {
    language: "text",
    code: "PR: Add CSV export\n- Add CSV export\n- Rename utils/ to shared/\n- Replace the test runner\n- Reformat unrelated files",
  },
  good: {
    language: "text",
    code: "PR: Add CSV export\n- Add CSV export\n- Add export tests\n- Update export documentation",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
