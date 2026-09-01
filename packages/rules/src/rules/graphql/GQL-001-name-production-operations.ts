import type { CodingRule } from "../../types";

export const gql001Rule = {
  id: "GQL-001",
  title: "Name production operations",
  summary:
    "Give queries, mutations, and subscriptions unique meaningful operation names.",
  rationale:
    "Operation names make logs, traces, errors, persisted operations, and refetch behavior easier to identify than anonymous documents.",
  level: "must",
  pack: "graphql",
  status: "stable",
  tags: ["debugging", "graphql", "operations"],
  bad: {
    language: "graphql",
    code: "query {\n  viewer { id name }\n}",
  },
  good: {
    language: "graphql",
    code: "query ViewerQuery {\n  viewer { id name }\n}",
  },
  references: [
    { label: "GraphQL — Queries", url: "https://graphql.org/learn/queries/" },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
