import type { CodingRule } from "../../types";

export const flag003Rule = {
  id: "FLAG-003",
  title: "Keep flag decisions at clear boundaries",
  summary:
    "Evaluate a feature flag in as few places as practical and pass the resulting behavior or state inward.",
  rationale:
    "Scattered flag checks create combinatorial states and make eventual removal much harder.",
  level: "should",
  pack: "feature-flags",
  status: "stable",
  tags: ["architecture", "feature-flags"],
  bad: {
    language: "ts",
    code: "const price = flags.newPricing ? getNewPrice() : getLegacyPrice();\nconst tax = flags.newPricing ? getNewTax() : getLegacyTax();\nconst total = flags.newPricing ? getNewTotal() : getLegacyTotal();",
  },
  good: {
    language: "ts",
    code: "const pricing = flags.newPricing ? newPricing : legacyPricing;\n\nconst price = pricing.getPrice();\nconst tax = pricing.getTax();\nconst total = pricing.getTotal();",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
