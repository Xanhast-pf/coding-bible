import type { CodingRule } from "../../types";

export const work004Rule = {
  id: "WORK-004",
  title: "Call out deferred or dependent work",
  summary:
    "If tests, cleanup, migrations, or dependent changes intentionally land separately, make that dependency visible to reviewers.",
  rationale:
    "Explicit follow-up boundaries prevent incomplete work from being mistaken for finished work and reduce accidental merge-order problems.",
  level: "should",
  pack: "workflow",
  status: "stable",
  tags: ["communication", "pull-requests", "workflow"],
  bad: {
    language: "markdown",
    code: "## PR\nDone.",
  },
  good: {
    language: "markdown",
    code: "## PR\nAdds the new parser.\n\nFollow-up: #482 removes the legacy parser after migration.\nDepends on: #479 landing first.",
  },
  detection: { autoFixable: false, detectable: false },
} satisfies CodingRule;
