import type { CodingRule } from "../types";

export const internationalizationRules = [
  {
    id: "I18N-001",
    title: "Localize user-visible text",
    summary:
      "Labels, messages, placeholders, tooltips, empty states, and other user-visible copy should come from the application's localization system.",
    rationale:
      "Hardcoded interface strings create inaccessible translation boundaries and are expensive to find after a product expands to more locales.",
    level: "must",
    pack: "internationalization",
    status: "stable",
    tags: ["i18n", "strings", "ui"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "I18N-004",
    title: "Design layouts for text expansion and direction",
    summary:
      "Avoid UI assumptions that only hold for short English text or left-to-right content.",
    rationale:
      "Translated labels can grow substantially, and RTL locales invert directional relationships that fixed-width or left/right-specific layouts may encode incorrectly.",
    level: "should",
    pack: "internationalization",
    status: "stable",
    tags: ["i18n", "layout", "rtl"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
