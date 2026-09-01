import type { CodingRule } from "../../types";

export const css003Rule = {
  id: "CSS-003",
  title: "Prefer layout systems over manual nudges",
  summary:
    "Use flexbox, grid, intrinsic sizing, and normal flow before offsets or spacer elements used only to force alignment.",
  rationale:
    "Layout primitives encode relationships and adapt to content, while manual nudges are brittle across font sizes, translations, and responsive states.",
  level: "should",
  pack: "css",
  status: "stable",
  tags: ["css", "layout", "responsive"],
  bad: {
    language: "css",
    code: ".toolbarButton + .toolbarButton {\n  margin-left: 12px;\n}\n\n.toolbarButton:last-child {\n  position: relative;\n  left: 4px;\n}",
  },
  good: {
    language: "css",
    code: ".toolbar {\n  align-items: center;\n  display: flex;\n  gap: var(--space-3);\n}",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
