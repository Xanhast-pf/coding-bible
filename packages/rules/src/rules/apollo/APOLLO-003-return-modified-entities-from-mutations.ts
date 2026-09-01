import type { CodingRule } from "../../types";

export const apollo003Rule = {
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
} satisfies CodingRule;
