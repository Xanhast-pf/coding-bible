import type { CodingRule } from "../../types";

export const css004Rule = {
  id: "CSS-004",
  title: "Keep component styles scoped",
  summary:
    "Component-specific styling should not leak into unrelated parts of the application through broad global selectors.",
  rationale:
    "Global leakage creates hidden coupling where changing one feature unexpectedly changes another.",
  level: "must",
  pack: "css",
  status: "stable",
  tags: ["css", "encapsulation", "scope"],
  bad: {
    language: "css",
    code: "button {\n  border-radius: 0;\n}\n\n.card h2 {\n  font-size: 14px;\n}",
  },
  good: {
    language: "css",
    code: "/* RuleCard.module.css */\n.title {\n  font-size: var(--font-size-heading);\n}\n\n.actionButton {\n  border-radius: var(--radius-control);\n}",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
