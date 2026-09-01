import type { CodingRule } from "../../types";

export const apollo004Rule = {
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
} satisfies CodingRule;
