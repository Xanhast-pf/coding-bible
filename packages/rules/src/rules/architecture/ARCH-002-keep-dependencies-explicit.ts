import type { CodingRule } from "../../types";

export const arch002Rule = {
  id: "ARCH-002",
  title: "Keep dependencies explicit",
  summary:
    "A module should receive or import the dependencies it actually uses rather than reaching through unrelated layers.",
  rationale:
    "Explicit dependencies expose coupling and make ownership, testing, and replacement easier to understand.",
  level: "should",
  pack: "architecture",
  status: "stable",
  tags: ["architecture", "dependencies"],
  bad: {
    language: "ts",
    code: 'export const completeCheckout = (order: Order) => {\n  app.services.analytics.track("checkout_completed", order.id);\n};',
  },
  good: {
    language: "ts",
    code: 'export const completeCheckout = (\n  order: Order,\n  analytics: Analytics,\n) => {\n  analytics.track("checkout_completed", order.id);\n};',
  },
  detection: {
    autoFixable: false,
    detectable: true,
    strategy: "semantic",
  },
} satisfies CodingRule;
