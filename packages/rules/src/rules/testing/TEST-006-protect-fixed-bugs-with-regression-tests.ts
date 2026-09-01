import type { CodingRule } from "../../types";

export const test006Rule = {
  id: "TEST-006",
  title: "Protect fixed bugs with regression tests",
  summary:
    "When a bug can be reproduced deterministically, add a test that fails before the fix and passes after it.",
  rationale:
    "A regression test preserves the newly learned system constraint and prevents the same defect from silently returning.",
  level: "should",
  pack: "testing",
  status: "stable",
  tags: ["regressions", "testing"],
  bad: {
    language: "ts",
    code: "expect(applyCoupon({ total: 100, expiresAt: tomorrow })).toBe(90);",
  },
  good: {
    language: "ts",
    code: 'it("rejects a coupon at its exact expiry time", () => {\n  const now = new Date("2026-08-28T12:00:00Z");\n\n  expect(applyCoupon({ total: 100, expiresAt: now }, now)).toBe(100);\n});',
  },
  detection: {
    autoFixable: false,
    detectable: true,
    strategy: "semantic",
  },
} satisfies CodingRule;
