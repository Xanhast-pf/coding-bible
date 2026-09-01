import type { CodingRule } from "../../types";

export const react001Rule = {
  id: "REACT-001",
  title: "Keep components focused on presentation",
  summary:
    "Move substantial transformation, orchestration, and business logic out of component markup.",
  rationale:
    "Separating presentation from behavior keeps components readable and makes logic independently testable.",
  level: "should",
  pack: "react",
  status: "stable",
  tags: ["architecture", "components", "separation-of-concerns"],
  bad: {
    language: "tsx",
    code: "const Checkout = ({ cart }) => {\n  const subtotal = cart.items.reduce((sum, item) => sum + item.price, 0);\n  const total = subtotal + calculateTax(subtotal);\n\n  return <CheckoutSummary total={total} />;\n};",
  },
  good: {
    language: "tsx",
    code: "const Checkout = ({ cart }) => {\n  const summary = useCheckoutSummary(cart);\n\n  return <CheckoutSummary summary={summary} />;\n};",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
