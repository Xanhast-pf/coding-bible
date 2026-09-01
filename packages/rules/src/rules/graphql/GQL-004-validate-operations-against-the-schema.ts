import type { CodingRule } from "../../types";

export const gql004Rule = {
  id: "GQL-004",
  title: "Validate operations against the schema",
  summary:
    "Generate or check client operations against the current schema instead of relying on hand-maintained assumptions about fields and types.",
  rationale:
    "GraphQL's schema can prove invalid fields, selections, and variable types before runtime, making schema-aware validation one of its strongest safety features.",
  level: "must",
  pack: "graphql",
  status: "stable",
  tags: ["graphql", "schema", "validation"],
  bad: {
    language: "sh",
    code: "pnpm type-check\n# GraphQL documents are never checked against the schema",
  },
  good: {
    language: "sh",
    code: "pnpm graphql:validate\npnpm type-check",
    note: "Use schema-aware validation or code generation in CI; the exact command depends on the project toolchain.",
  },
  references: [
    {
      label: "GraphQL — Validation",
      url: "https://graphql.org/learn/validation/",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "lint" },
} satisfies CodingRule;
