import type { CodingRule } from "../../types";

export const i18n003Rule = {
  id: "I18N-003",
  title: "Use Intl for locale-sensitive formatting",
  summary:
    "Prefer Intl.DateTimeFormat, Intl.NumberFormat, and related platform APIs for dates, numbers, currencies, lists, and relative time.",
  rationale:
    "Intl encodes locale-specific formatting rules and avoids shipping another library for capabilities already provided by the platform.",
  level: "should",
  pack: "internationalization",
  status: "stable",
  tags: ["dates", "i18n", "intl", "numbers"],
  bad: {
    language: "ts",
    code: "const label = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;",
  },
  good: {
    language: "ts",
    code: 'const label = new Intl.DateTimeFormat(locale, {\n  dateStyle: "medium",\n}).format(date);',
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
