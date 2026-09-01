import type { CodingRule } from "../../types";

export const apollo001Rule = {
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
    code: 'const cache = new InMemoryCache({\n  typePolicies: {\n    Product: { keyFields: ["sku"] },\n  },\n});',
  },
  references: [
    {
      label: "Apollo Client — Cache configuration",
      url: "https://www.apollographql.com/docs/react/caching/cache-configuration",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
