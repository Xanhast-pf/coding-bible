import type { CodingRule } from "../../types";

export const dep003Rule = {
  id: "DEP-003",
  title: "Remove unused dependencies",
  summary:
    "Delete packages when no production, test, build, or tooling path still requires them.",
  rationale:
    "Unused packages continue to consume install time, security attention, and upgrade effort while providing no value.",
  level: "must",
  pack: "dependencies",
  status: "stable",
  tags: ["cleanup", "dependencies"],
  bad: {
    language: "jsonc",
    code: '{\n  "dependencies": {\n    "date-fns": "^4.0.0",\n    "moment": "^2.0.0"\n  }\n}\n\n// moment has no remaining imports.',
  },
  good: {
    language: "json",
    code: '{\n  "dependencies": {\n    "date-fns": "^4.0.0"\n  }\n}',
  },
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
