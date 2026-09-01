import type { CodingRule } from "../../types";

export const core002Rule = {
  id: "CORE-002",
  title: "Use descriptive names",
  summary: "Names should communicate the role of a value, function, or module.",
  rationale:
    "Descriptive names reduce the surrounding code a reader must inspect to understand behavior.",
  level: "must",
  pack: "core",
  status: "stable",
  tags: ["clarity", "naming"],
  bad: {
    language: "ts",
    code: "strategies.filter((s) => s.goalType);",
  },
  good: {
    language: "ts",
    code: "strategies.filter((strategy) => strategy.goalType);",
  },
  exceptions: [
    "Established mathematical notation in a clearly mathematical scope.",
    "Conventional short names whose meaning is unambiguous in the immediate context.",
  ],
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
