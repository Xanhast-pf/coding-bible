import type { CodingRule } from "../../types";

export const test002Rule = {
  id: "TEST-002",
  title: "Test realistic states",
  summary:
    "Edge cases should come from real contracts and failure modes rather than impossible values invented only to increase coverage.",
  rationale:
    "Tests for impossible states add maintenance cost while distracting from failures the system can actually encounter.",
  level: "should",
  pack: "testing",
  status: "stable",
  tags: ["edge-cases", "testing"],
  bad: {
    language: "ts",
    code: 'expect(formatUser(null as never)).toBe("Unknown");',
  },
  good: {
    language: "ts",
    code: 'expect(\n  formatUser({ firstName: "", lastName: "Lee" }),\n).toBe("Lee");',
  },
  detection: {
    autoFixable: false,
    detectable: true,
    strategy: "semantic",
  },
} satisfies CodingRule;
