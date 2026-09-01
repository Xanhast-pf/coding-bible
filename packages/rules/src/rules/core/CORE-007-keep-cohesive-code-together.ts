import type { CodingRule } from "../../types";

export const core007Rule = {
  id: "CORE-007",
  title: "Keep cohesive code together",
  summary:
    "Place closely related logic together instead of scattering tiny pieces across unnecessary files.",
  rationale:
    "Excessive fragmentation forces readers to jump between files to understand one behavior and can be as harmful as oversized modules.",
  level: "should",
  pack: "core",
  status: "stable",
  tags: ["cohesion", "files", "maintainability"],
  bad: {
    language: "ts",
    code: "// formatPrice.ts\nexport const formatPrice = (value: number) => { /* ... */ };\n\n// getCurrencySymbol.ts\nexport const getCurrencySymbol = (currency: Currency) => { /* ... */ };",
  },
  good: {
    language: "ts",
    code: "// pricing/formatters.ts\nexport const formatPrice = (value: number) => { /* ... */ };\nexport const getCurrencySymbol = (currency: Currency) => { /* ... */ };",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
