import type { CodingRule } from "../../types";

export const core006Rule = {
  id: "CORE-006",
  title: "Name meaningful constants",
  summary:
    "Give unexplained values a name when their meaning, policy, or unit is not obvious from local context.",
  rationale:
    "A named value communicates why a number or string exists and makes policy changes less error-prone.",
  level: "should",
  pack: "core",
  status: "stable",
  tags: ["clarity", "constants"],
  bad: {
    language: "ts",
    code: "if (attempts >= 5) lockAccount();",
  },
  good: {
    language: "ts",
    code: "const MAX_LOGIN_ATTEMPTS = 5;\n\nif (attempts >= MAX_LOGIN_ATTEMPTS) lockAccount();",
  },
  exceptions: [
    "Values whose meaning is inherent to the operation, such as 0 when checking an array length.",
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
