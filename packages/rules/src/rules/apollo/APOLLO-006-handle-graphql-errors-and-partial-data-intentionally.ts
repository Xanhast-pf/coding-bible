import type { CodingRule } from "../../types";

export const apollo006Rule = {
  id: "APOLLO-006",
  title: "Handle GraphQL errors and partial data intentionally",
  summary:
    "Choose errorPolicy based on whether partial data is usable and distinguish GraphQL execution errors from network or transport failures.",
  rationale:
    "A GraphQL response may contain both data and errors; treating every failure as identical can discard useful data or display invalid partial state.",
  level: "must",
  pack: "apollo",
  status: "stable",
  tags: ["apollo", "errors", "graphql", "partial-data"],
  bad: {
    language: "tsx",
    code: 'const { data } = useQuery(DASHBOARD_QUERY, {\n  errorPolicy: "ignore",\n});',
  },
  good: {
    language: "tsx",
    code: 'const { data, error } = useQuery(DASHBOARD_QUERY, {\n  errorPolicy: "all",\n});\n\nif (error && !data) return <ErrorState />;\nreturn <Dashboard data={data} warning={error?.message} />;',
  },
  references: [
    {
      label: "Apollo Client — Error handling",
      url: "https://www.apollographql.com/docs/react/data/error-handling",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
