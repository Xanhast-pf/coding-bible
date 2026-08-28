import type { CodingRule } from "../types";

export const cssRules = [
  {
    id: "CSS-001",
    title: "Name styles by role, not appearance",
    summary:
      "Class names should describe what an element is responsible for rather than its current visual treatment.",
    rationale:
      "Role-based names survive visual redesigns and communicate intent without coupling markup to presentation.",
    level: "should",
    pack: "css",
    status: "stable",
    tags: ["css", "naming"],
    bad: { language: "css", code: ".redBox {}" },
    good: { language: "css", code: ".errorMessage {}" },
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
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
  },
  {
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
  },
  {
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
  },
] satisfies readonly CodingRule[];
