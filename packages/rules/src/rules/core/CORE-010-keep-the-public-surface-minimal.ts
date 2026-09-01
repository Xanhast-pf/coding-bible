import type { CodingRule } from "../../types";

export const core010Rule = {
  id: "CORE-010",
  title: "Keep the public surface minimal",
  summary:
    "Do not export functions, types, modules, or abstractions that have no external consumer.",
  rationale:
    "Every export becomes a dependency point that constrains future refactoring and increases the surface maintainers must understand.",
  level: "should",
  pack: "core",
  status: "stable",
  tags: ["api-design", "exports", "maintainability"],
  bad: {
    language: "ts",
    code: "export const normalizeEmail = (email: string) =>\n  email.trim().toLowerCase();\n\nexport const createUser = (email: string) =>\n  repository.create(normalizeEmail(email));",
  },
  good: {
    language: "ts",
    code: "const normalizeEmail = (email: string) =>\n  email.trim().toLowerCase();\n\nexport const createUser = (email: string) =>\n  repository.create(normalizeEmail(email));",
  },
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
