import type { CodingRule } from "../../types";

export const gql005Rule = {
  id: "GQL-005",
  title: "Treat nullability as part of the contract",
  summary:
    "Model nullable fields and variables exactly as the schema declares them rather than erasing nullability in client types.",
  rationale:
    "GraphQL nullability expresses real response and input guarantees; weakening or strengthening it locally creates impossible assumptions.",
  level: "must",
  pack: "graphql",
  status: "stable",
  tags: ["graphql", "nullability", "schema", "types"],
  bad: {
    language: "ts",
    code: "// Schema: nickname: String\ntype User = { nickname: string };",
  },
  good: {
    language: "ts",
    code: "// Schema: nickname: String\ntype User = { nickname: string | null };",
  },
  references: [
    { label: "GraphQL — Schema", url: "https://graphql.org/learn/schema/" },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
