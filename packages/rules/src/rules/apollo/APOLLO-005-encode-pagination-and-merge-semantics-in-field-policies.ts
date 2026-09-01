import type { CodingRule } from "../../types";

export const apollo005Rule = {
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
} satisfies CodingRule;
