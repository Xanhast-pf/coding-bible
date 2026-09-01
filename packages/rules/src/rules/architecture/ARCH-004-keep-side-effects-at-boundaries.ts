import type { CodingRule } from "../../types";

export const arch004Rule = {
  id: "ARCH-004",
  title: "Keep side effects at boundaries",
  summary:
    "Prefer pure transformation logic internally and isolate network, storage, clock, DOM, and other side effects behind clear boundaries.",
  rationale:
    "Isolated side effects make behavior easier to test, replay, reason about, and replace.",
  level: "should",
  pack: "architecture",
  status: "stable",
  tags: ["architecture", "side-effects", "testability"],
  bad: {
    language: "ts",
    code: 'export const calculateCartTotal = () => {\n  const cart = JSON.parse(localStorage.getItem("cart") ?? "[]");\n  return cart.reduce((sum, item) => sum + item.price, 0);\n};',
  },
  good: {
    language: "ts",
    code: "export const calculateCartTotal = (cart: CartItem[]) =>\n  cart.reduce((sum, item) => sum + item.price, 0);\n\nconst cart = cartStorage.load();\nconst total = calculateCartTotal(cart);",
  },
  detection: {
    autoFixable: false,
    detectable: true,
    strategy: "semantic",
  },
} satisfies CodingRule;
