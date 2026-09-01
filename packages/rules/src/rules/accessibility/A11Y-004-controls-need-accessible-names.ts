import type { CodingRule } from "../../types";

export const a11y004Rule = {
  id: "A11Y-004",
  title: "Controls need accessible names",
  summary:
    "Inputs and interactive controls must expose a meaningful programmatic name through visible text, a label, or appropriate accessible naming.",
  rationale:
    "A control that is visually recognizable but unnamed programmatically is ambiguous or unusable to assistive technology.",
  level: "must",
  pack: "accessibility",
  status: "stable",
  tags: ["accessibility", "forms", "labels"],
  bad: {
    language: "tsx",
    code: '<button type="button" onClick={closeDialog}>\n  <CloseIcon />\n</button>',
  },
  good: {
    language: "tsx",
    code: '<button\n  type="button"\n  aria-label="Close dialog"\n  onClick={closeDialog}\n>\n  <CloseIcon aria-hidden="true" />\n</button>',
  },
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
