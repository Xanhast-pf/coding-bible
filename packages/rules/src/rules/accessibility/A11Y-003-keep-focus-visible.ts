import type { CodingRule } from "../../types";

export const a11y003Rule = {
  id: "A11Y-003",
  title: "Keep focus visible",
  summary:
    "Interactive elements must expose a clear visible state when they receive keyboard focus.",
  rationale:
    "Keyboard users need a persistent visual indicator of where the next interaction will occur.",
  level: "must",
  pack: "accessibility",
  status: "stable",
  tags: ["accessibility", "focus", "keyboard"],
  bad: {
    language: "css",
    code: "*:focus {\n  outline: none;\n}",
  },
  good: {
    language: "css",
    code: ".button:focus-visible {\n  outline: 2px solid var(--focus-ring);\n  outline-offset: 2px;\n}",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
