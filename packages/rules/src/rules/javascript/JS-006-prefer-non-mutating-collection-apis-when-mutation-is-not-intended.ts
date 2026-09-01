import type { CodingRule } from "../../types";

export const js006Rule = {
  id: "JS-006",
  title: "Prefer non-mutating collection APIs when mutation is not intended",
  summary:
    "Use APIs such as toSorted, toReversed, and toSpliced when callers should retain the original collection.",
  rationale:
    "Non-mutating operations make ownership explicit and prevent changes from leaking through shared references.",
  level: "prefer",
  pack: "javascript",
  status: "stable",
  tags: ["arrays", "immutability", "modern-javascript"],
  bad: {
    language: "ts",
    code: "const sortedUsers = users.sort(compareUsers);",
  },
  good: {
    language: "ts",
    code: "const sortedUsers = users.toSorted(compareUsers);",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
