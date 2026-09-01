import type { CodingRule } from "../../types";

export const a11y006Rule = {
  id: "A11Y-006",
  title: "Respect reduced motion preferences",
  summary:
    "Non-essential animation and smooth motion should adapt when the user requests reduced motion.",
  rationale:
    "Motion can cause discomfort or make interfaces harder to use, and operating systems expose a preference specifically for this need.",
  level: "must",
  pack: "accessibility",
  status: "stable",
  tags: ["accessibility", "motion", "preferences"],
  bad: {
    language: "css",
    code: ".panel {\n  scroll-behavior: smooth;\n  transition: transform 300ms ease;\n}",
  },
  good: {
    language: "css",
    code: ".panel {\n  scroll-behavior: smooth;\n  transition: transform 300ms ease;\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .panel {\n    scroll-behavior: auto;\n    transition: none;\n  }\n}",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
