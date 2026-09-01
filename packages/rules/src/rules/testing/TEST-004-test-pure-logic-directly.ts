import type { CodingRule } from "../../types";

export const test004Rule = {
  id: "TEST-004",
  title: "Test pure logic directly",
  summary:
    "When transformation or decision logic has its own responsibility, test it at that boundary rather than only through a distant UI or controller.",
  rationale:
    "Direct tests are faster, clearer about failures, and avoid coupling business assertions to unrelated rendering or infrastructure.",
  level: "should",
  pack: "testing",
  status: "stable",
  tags: ["logic", "testing", "unit-tests"],
  bad: {
    language: "tsx",
    code: 'render(<Checkout subtotal={100} tier="gold" />);\nexpect(screen.getByText("$90.00")).toBeVisible();',
  },
  good: {
    language: "ts",
    code: 'expect(\n  calculateDiscount({ subtotal: 100, tier: "gold" }),\n).toBe(10);',
  },
  detection: {
    autoFixable: false,
    detectable: true,
    strategy: "semantic",
  },
} satisfies CodingRule;
