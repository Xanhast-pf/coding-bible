import type { CodingRule } from "../../types";

export const apollo002Rule = {
  id: "APOLLO-002",
  title: "Choose fetch policies deliberately",
  summary:
    "Use cache-first, cache-and-network, network-only, no-cache, and related policies according to data freshness requirements rather than applying one policy everywhere.",
  rationale:
    "Fetch policy is a correctness and UX decision: it controls whether the UI trusts cached data, waits for the network, or persists results for future consumers.",
  level: "should",
  pack: "apollo",
  status: "stable",
  tags: ["apollo", "cache", "fetch-policy", "queries"],
  bad: {
    language: "ts",
    code: 'const client = new ApolloClient({\n  cache,\n  defaultOptions: {\n    watchQuery: { fetchPolicy: "network-only" },\n  },\n});',
  },
  good: {
    language: "tsx",
    code: 'useQuery(GET_PROFILE, {\n  fetchPolicy: "cache-and-network",\n  nextFetchPolicy: "cache-first",\n});',
    note: "Choose a policy per freshness requirement; this is one example, not a universal default.",
  },
  references: [
    {
      label: "Apollo Client — Queries",
      url: "https://www.apollographql.com/docs/react/data/queries",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
