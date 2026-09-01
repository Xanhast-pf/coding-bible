import type { CodingRule } from "../../types";

export const gql003Rule = {
  id: "GQL-003",
  title: "Use fragments for genuinely shared selection sets",
  summary:
    "Extract repeated or component-owned field groups into named fragments rather than duplicating the same selection in many operations.",
  rationale:
    "Fragments keep repeated data requirements consistent and make component-level GraphQL requirements composable.",
  level: "should",
  pack: "graphql",
  status: "stable",
  tags: ["fragments", "graphql", "reuse"],
  bad: {
    language: "graphql",
    code: "query DashboardQuery {\n  viewer { id name avatarUrl }\n  owner { id name avatarUrl }\n}",
  },
  good: {
    language: "graphql",
    code: "fragment UserSummary on User {\n  id\n  name\n  avatarUrl\n}\n\nquery DashboardQuery {\n  viewer { ...UserSummary }\n  owner { ...UserSummary }\n}",
  },
  references: [
    { label: "GraphQL — Queries", url: "https://graphql.org/learn/queries/" },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
