import type { CodingRule } from "../../types";

export const js003Rule = {
  id: "JS-003",
  title: "Prefer default parameters for default inputs",
  summary:
    "When undefined should map to a stable default, express that contract in the function signature.",
  rationale:
    "Default parameters centralize input normalization and avoid mutation or guard boilerplate inside the function body.",
  level: "prefer",
  pack: "javascript",
  status: "stable",
  tags: ["defaults", "functions"],
  bad: {
    language: "ts",
    code: "const process = (items?: Item[]) => {\n  items = items ?? [];\n};",
  },
  good: {
    language: "ts",
    code: "const process = (items: Item[] = []) => {\n  // ...\n};",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
