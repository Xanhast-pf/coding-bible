import type { CodingRule } from "../types";

export const graphqlRules = [
  {
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
    references: [{ label: "GraphQL — Queries", url: "https://graphql.org/learn/queries/" }],
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
    id: "GQL-002",
    title: "Pass dynamic values as variables",
    summary:
      "Use GraphQL variables for runtime values instead of interpolating user or application data into operation strings.",
    rationale:
      "Variables preserve a stable operation document, keep values typed separately, and avoid fragile or unsafe string construction.",
    level: "must",
    pack: "graphql",
    status: "stable",
    tags: ["graphql", "queries", "variables"],
    references: [{ label: "GraphQL — Queries", url: "https://graphql.org/learn/queries/" }],
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
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
    references: [{ label: "GraphQL — Queries", url: "https://graphql.org/learn/queries/" }],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
    references: [
      {
        label: "GraphQL — Validation",
        url: "https://graphql.org/learn/validation/",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "lint" },
  },
  {
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
    references: [{ label: "GraphQL — Schema", url: "https://graphql.org/learn/schema/" }],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
    references: [
      {
        label: "GraphQL — Pagination",
        url: "https://graphql.org/learn/pagination/",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
