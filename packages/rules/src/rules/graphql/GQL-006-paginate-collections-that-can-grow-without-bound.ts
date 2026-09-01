import type { CodingRule } from "../../types";

export const gql006Rule = {
  id: "GQL-006",
  title: "Paginate collections that can grow without bound",
  summary:
    "Do not design clients or schemas around fetching an ever-growing collection in one operation; use an appropriate pagination model.",
  rationale:
    "Unbounded lists create unpredictable latency, payload size, memory pressure, and rendering cost.",
  level: "must",
  pack: "graphql",
  status: "stable",
  tags: ["graphql", "pagination", "performance"],
  bad: {
    language: "graphql",
    code: "query UsersQuery {\n  users { id name }\n}",
  },
  good: {
    language: "graphql",
    code: "query UsersQuery($after: String, $first: Int!) {\n  users(after: $after, first: $first) {\n    edges { node { id name } }\n    pageInfo { endCursor hasNextPage }\n  }\n}",
  },
  references: [
    {
      label: "GraphQL — Pagination",
      url: "https://graphql.org/learn/pagination/",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
