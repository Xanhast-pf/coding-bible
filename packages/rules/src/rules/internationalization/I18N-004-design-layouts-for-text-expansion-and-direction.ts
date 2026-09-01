import type { CodingRule } from "../../types";

export const i18n004Rule = {
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
  bad: {
    language: "css",
    code: ".label {\n  margin-left: 8px;\n  width: 120px;\n  white-space: nowrap;\n}",
  },
  good: {
    language: "css",
    code: ".label {\n  margin-inline-start: var(--space-2);\n  min-inline-size: 0;\n  overflow-wrap: anywhere;\n}",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
