import type { CodingRule } from "../types";

export const apolloRules = [
  {
    id: "APOLLO-001",
    title: "Define stable cache identity",
    summary:
      "Ensure normalized entity types have stable identifiers, configuring keyFields when the schema does not use Apollo's default ID conventions.",
    rationale:
      "Apollo's normalized cache can only merge references to the same entity reliably when it can identify that entity consistently across operations.",
    level: "must",
    pack: "apollo",
    status: "stable",
    tags: ["apollo", "cache", "identity"],
    bad: {
      language: "ts",
      code: "// Product has sku, but no id/_id.\nconst cache = new InMemoryCache();",
    },
    good: {
      language: "ts",
      code: "const cache = new InMemoryCache({\n  typePolicies: {\n    Product: { keyFields: [\"sku\"] },\n  },\n});",
    },
    references: [
      {
        label: "Apollo Client — Cache configuration",
        url: "https://www.apollographql.com/docs/react/caching/cache-configuration",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
      code: "const client = new ApolloClient({\n  cache,\n  defaultOptions: {\n    watchQuery: { fetchPolicy: \"network-only\" },\n  },\n});",
    },
    good: {
      language: "tsx",
      code: "useQuery(GET_PROFILE, {\n  fetchPolicy: \"cache-and-network\",\n  nextFetchPolicy: \"cache-first\",\n});",
      note: "Choose a policy per freshness requirement; this is one example, not a universal default.",
    },
    references: [
      {
        label: "Apollo Client — Queries",
        url: "https://www.apollographql.com/docs/react/data/queries",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "APOLLO-003",
    title: "Return modified entities from mutations",
    summary:
      "When practical, mutation responses should include the modified entities and fields the UI/cache needs to reconcile.",
    rationale:
      "Apollo can normalize returned entities automatically, reducing manual cache manipulation and extra network requests.",
    level: "should",
    pack: "apollo",
    status: "stable",
    tags: ["apollo", "cache", "mutations"],
    bad: {
      language: "graphql",
      code: "mutation RenameUser($id: ID!, $name: String!) {\n  renameUser(id: $id, name: $name) {\n    success\n  }\n}",
    },
    good: {
      language: "graphql",
      code: "mutation RenameUser($id: ID!, $name: String!) {\n  renameUser(id: $id, name: $name) {\n    user { id name }\n  }\n}",
    },
    references: [
      {
        label: "Apollo Client — Mutations",
        url: "https://www.apollographql.com/docs/react/data/mutations",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "APOLLO-004",
    title: "Reconcile mutation results explicitly",
    summary:
      "After a mutation, rely on normalized returned entities, update the cache, or selectively refetch affected queries instead of leaving stale client state.",
    rationale:
      "Server mutation success does not automatically guarantee every cached list or derived field reflects the new server state.",
    level: "must",
    pack: "apollo",
    status: "stable",
    tags: ["apollo", "cache", "mutations", "refetch"],
    bad: {
      language: "tsx",
      code: "await deleteTodo({ variables: { id } });\n// GET_TODOS may still contain the deleted item.",
    },
    good: {
      language: "tsx",
      code: "await deleteTodo({\n  variables: { id },\n  refetchQueries: [{ query: GET_TODOS }],\n});",
    },
    references: [
      {
        label: "Apollo Client — Mutations",
        url: "https://www.apollographql.com/docs/react/data/mutations",
      },
      {
        label: "Apollo Client — Refetching",
        url: "https://www.apollographql.com/docs/react/data/refetching",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "APOLLO-005",
    title: "Encode pagination and merge semantics in field policies",
    summary:
      "When cached fields require argument-aware identity, pagination, or custom merging, define that behavior in typePolicies instead of scattering cache repair logic across components.",
    rationale:
      "Field policies centralize how the normalized cache reads and merges a field, producing consistent behavior for every consumer.",
    level: "should",
    pack: "apollo",
    status: "stable",
    tags: ["apollo", "cache", "pagination", "type-policies"],
    bad: {
      language: "tsx",
      code: "const nextPage = await fetchMore({ variables: { offset: items.length } });\nsetItems((items) => [...items, ...nextPage.data.feed]);",
    },
    good: {
      language: "ts",
      code: "const cache = new InMemoryCache({\n  typePolicies: {\n    Query: {\n      fields: {\n        feed: offsetLimitPagination(),\n      },\n    },\n  },\n});",
    },
    references: [
      {
        label: "Apollo Client — Cached field behavior",
        url: "https://www.apollographql.com/docs/react/caching/cache-field-behavior",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
      code: "const { data } = useQuery(DASHBOARD_QUERY, {\n  errorPolicy: \"ignore\",\n});",
    },
    good: {
      language: "tsx",
      code: "const { data, error } = useQuery(DASHBOARD_QUERY, {\n  errorPolicy: \"all\",\n});\n\nif (error && !data) return <ErrorState />;\nreturn <Dashboard data={data} warning={error?.message} />;",
    },
    references: [
      {
        label: "Apollo Client — Error handling",
        url: "https://www.apollographql.com/docs/react/data/error-handling",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
