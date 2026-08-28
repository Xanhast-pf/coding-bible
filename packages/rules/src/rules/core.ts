import type { CodingRule } from "../types";

export const coreRules = [
  {
    id: "CORE-001",
    title: "Optimize for understanding",
    summary: "Prefer code that communicates intent without requiring reconstruction by the reader.",
    rationale:
      "Code is maintained and reviewed far more often than it is initially written. Readability lowers review cost, defect risk, and onboarding time.",
    level: "must",
    pack: "core",
    status: "stable",
    tags: ["clarity", "maintainability"],
    detection: { autoFixable: false, detectable: false },
  },
  {
    id: "CORE-002",
    title: "Use descriptive names",
    summary: "Names should communicate the role of a value, function, or module.",
    rationale:
      "Descriptive names reduce the surrounding code a reader must inspect to understand behavior.",
    level: "must",
    pack: "core",
    status: "stable",
    tags: ["clarity", "naming"],
    bad: { language: "ts", code: "strategies.filter((s) => s.goalType);" },
    good: { language: "ts", code: "strategies.filter((strategy) => strategy.goalType);" },
    exceptions: ["Established mathematical notation in a clearly mathematical scope."],
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
    id: "CORE-003",
    title: "Prefer const",
    summary: "Declare bindings with const unless reassignment is required.",
    rationale:
      "Stable bindings reduce the number of state transitions a reader must track and prevent accidental reassignment.",
    level: "must",
    pack: "core",
    status: "stable",
    tags: ["immutability", "variables"],
    bad: { language: "ts", code: "let user = getUser();" },
    good: { language: "ts", code: "const user = getUser();" },
    detection: { autoFixable: true, detectable: true, strategy: "lint" },
  },
  {
    id: "CORE-004",
    title: "Comments explain why",
    summary: "Do not narrate obvious code. Document decisions, constraints, and workarounds.",
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
  },
] satisfies readonly CodingRule[];
