import type { CodingRule } from "../../types";

export const a11y005Rule = {
  id: "A11Y-005",
  title: "Do not communicate with color alone",
  summary:
    "When color carries status or meaning, provide another perceivable cue such as text, iconography, shape, or position.",
  rationale:
    "Color perception varies and may be unavailable entirely. Redundant cues make meaning robust for more users and environments.",
  level: "must",
  pack: "accessibility",
  status: "stable",
  tags: ["accessibility", "color", "semantics"],
  bad: {
    language: "tsx",
    code: '<span className={isOverdue ? "statusRed" : "statusGreen"}>\n  ●\n</span>',
  },
  good: {
    language: "tsx",
    code: '<span className={isOverdue ? "statusRed" : "statusGreen"}>\n  <StatusIcon aria-hidden="true" />\n  {isOverdue ? "Overdue" : "On time"}\n</span>',
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
