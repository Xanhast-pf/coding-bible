import type { CodingRule } from "../../types";

export const i18n002Rule = {
  id: "I18N-002",
  title: "Parameterize messages instead of concatenating sentences",
  summary:
    "Use the localization system's placeholders and plural/select features rather than assembling human sentences from fragments.",
  rationale:
    "Word order, plural rules, gender, and punctuation vary by language; concatenation assumes English-like grammar.",
  level: "must",
  pack: "internationalization",
  status: "stable",
  tags: ["i18n", "messages", "plurals"],
  bad: {
    language: "ts",
    code: 'const message = "You have " + count + (count === 1 ? " item" : " items");',
  },
  good: {
    language: "ts",
    code: 'const message = t("cart.itemCount", { count });\n\n// cart.itemCount:\n// "You have {count, plural, one {# item} other {# items}}"',
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
