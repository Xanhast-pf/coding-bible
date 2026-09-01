import type { CodingRule } from "../../types";

export const test005Rule = {
  id: "TEST-005",
  title: "Use snapshots selectively",
  summary:
    "Prefer focused assertions when the behavior can be expressed directly; use snapshots when a meaningful structured output is expensive to assert piecemeal.",
  rationale:
    "Large snapshots are easy to approve mechanically and often obscure which behavior was intended to change.",
  level: "prefer",
  pack: "testing",
  status: "stable",
  tags: ["snapshots", "testing"],
  bad: {
    language: "tsx",
    code: "const { container } = render(<CheckoutPage />);\nexpect(container).toMatchSnapshot();",
  },
  good: {
    language: "tsx",
    code: 'render(<CheckoutPage />);\nexpect(\n  screen.getByRole("heading", { name: "Checkout" }),\n).toBeVisible();',
  },
  detection: {
    autoFixable: false,
    detectable: true,
    strategy: "semantic",
  },
} satisfies CodingRule;
