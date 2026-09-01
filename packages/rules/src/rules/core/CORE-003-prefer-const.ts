import type { CodingRule } from "../../types";

export const core003Rule = {
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
} satisfies CodingRule;
