import type { CodingRule } from "../../types";

export const core004Rule = {
  id: "CORE-004",
  title: "Comments explain why",
  summary:
    "Do not narrate obvious code. Document decisions, constraints, and workarounds.",
  rationale:
    "Narrative comments duplicate code and become stale. Decision comments preserve context the implementation cannot express.",
  level: "should",
  pack: "core",
  status: "stable",
  tags: ["comments", "documentation"],
  bad: {
    language: "ts",
    code: "// Filter active users\nconst activeUsers = users.filter((user) => user.active);",
  },
  good: {
    language: "ts",
    code: "// Suspended accounts remain for audit history, so exclude only inactive accounts.\nconst activeUsers = users.filter((user) => user.active);",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
