import type { CodingRule } from "../../types";

export const i18n001Rule = {
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
  bad: {
    language: "tsx",
    code: 'import { FormattedMessage } from "react-intl";\n\nexport const SaveButton = () => (\n  <button type="button">Save changes</button>\n);',
  },
  good: {
    language: "tsx",
    code: 'import { FormattedMessage } from "react-intl";\n\nexport const SaveButton = () => (\n  <button type="button">\n    <FormattedMessage id="actions.saveChanges" defaultMessage="Save changes" />\n  </button>\n);',
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
