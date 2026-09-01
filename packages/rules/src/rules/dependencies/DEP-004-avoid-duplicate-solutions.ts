import type { CodingRule } from "../../types";

export const dep004Rule = {
  id: "DEP-004",
  title: "Avoid duplicate solutions",
  summary:
    "Do not introduce a second library for a capability the project already solves adequately.",
  rationale:
    "Multiple libraries for the same job increase bundle size, cognitive load, inconsistent conventions, and migration cost.",
  level: "should",
  pack: "dependencies",
  status: "stable",
  tags: ["dependencies", "consistency"],
  bad: {
    language: "json",
    code: '{\n  "dependencies": {\n    "axios": "^1.0.0",\n    "ky": "^1.0.0"\n  }\n}',
  },
  good: {
    language: "json",
    code: '{\n  "dependencies": {\n    "ky": "^1.0.0"\n  }\n}',
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
