import type { CodingRule } from "../../types";

export const gql002Rule = {
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
  bad: {
    language: "ts",
    code: 'const document = gql`\n  query UserQuery {\n    user(id: "${userId}") { id name }\n  }\n`;',
  },
  good: {
    language: "ts",
    code: "const document = gql`\n  query UserQuery($id: ID!) {\n    user(id: $id) { id name }\n  }\n`;\n\nclient.query({ query: document, variables: { id: userId } });",
  },
  references: [
    { label: "GraphQL — Queries", url: "https://graphql.org/learn/queries/" },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
