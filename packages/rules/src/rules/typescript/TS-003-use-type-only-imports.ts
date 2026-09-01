import type { CodingRule } from "../../types";

export const ts003Rule = {
  id: "TS-003",
  title: "Use type-only imports",
  summary: "Use import type when an import exists only in the type system.",
  rationale:
    "Type-only imports communicate intent and prevent accidental runtime coupling or emitted imports.",
  level: "should",
  pack: "typescript",
  status: "stable",
  tags: ["imports", "types"],
  bad: {
    language: "ts",
    code: 'import { User } from "./types";\n\nconst user: User = getUser();',
  },
  good: {
    language: "ts",
    code: 'import type { User } from "./types";',
  },
  detection: { autoFixable: true, detectable: true, strategy: "lint" },
} satisfies CodingRule;
