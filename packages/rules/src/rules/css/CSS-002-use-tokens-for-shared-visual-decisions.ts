import type { CodingRule } from "../../types";

export const css002Rule = {
  id: "CSS-002",
  title: "Use tokens for shared visual decisions",
  summary:
    "Repeated semantic values such as colors, spacing, radii, typography, and elevation should come from a shared token source.",
  rationale:
    "Tokens keep visual decisions consistent and make system-wide changes possible without hunting through feature styles.",
  level: "should",
  pack: "css",
  status: "stable",
  tags: ["css", "design-tokens", "maintainability"],
  bad: {
    language: "css",
    code: ".saveButton {\n  background: #34ff6d;\n  border-radius: 8px;\n  padding: 8px 16px;\n}\n\n.confirmButton {\n  background: #34ff6d;\n  border-radius: 8px;\n}",
  },
  good: {
    language: "css",
    code: ":root {\n  --color-accent: #34ff6d;\n  --radius-control: 0.5rem;\n}\n\n.saveButton,\n.confirmButton {\n  background: var(--color-accent);\n  border-radius: var(--radius-control);\n}",
  },
  exceptions: [
    "A truly one-off value may stay local when promoting it would create a meaningless token.",
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
