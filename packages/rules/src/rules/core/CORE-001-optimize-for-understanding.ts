import type { CodingRule } from "../../types";

export const core001Rule = {
  id: "CORE-001",
  title: "Optimize for understanding",
  summary:
    "Prefer code that communicates intent without requiring reconstruction by the reader.",
  rationale:
    "Code is maintained and reviewed far more often than it is initially written. Readability lowers review cost, defect risk, and onboarding time.",
  level: "must",
  pack: "core",
  status: "stable",
  tags: ["clarity", "maintainability"],
  bad: {
    language: "ts",
    code: "return users.filter((u) => u.a && !u.s).map((u) => u.e);",
  },
  good: {
    language: "ts",
    code: "const activeUsers = users.filter(\n  (user) => user.active && !user.suspended,\n);\n\nreturn activeUsers.map((user) => user.email);",
  },
  detection: { autoFixable: false, detectable: false },
} satisfies CodingRule;
