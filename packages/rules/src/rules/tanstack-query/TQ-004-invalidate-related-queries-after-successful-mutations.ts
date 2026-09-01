import type { CodingRule } from "../../types";

export const tq004Rule = {
  id: "TQ-004",
  title: "Invalidate related queries after successful mutations",
  summary:
    "When a mutation makes cached server data stale, invalidate the smallest relevant query-key scope after success.",
  rationale:
    "Targeted invalidation lets TanStack Query mark dependent data stale and refetch active consumers without manually synchronizing duplicate server state.",
  level: "must",
  pack: "tanstack-query",
  status: "stable",
  tags: ["invalidation", "mutations", "tanstack-query"],
  bad: {
    language: "tsx",
    code: "useMutation({\n  mutationFn: addTodo,\n});",
  },
  good: {
    language: "tsx",
    code: 'useMutation({\n  mutationFn: addTodo,\n  onSuccess: () =>\n    queryClient.invalidateQueries({ queryKey: ["todos"] }),\n});',
  },
  references: [
    {
      label: "TanStack Query — Invalidations from Mutations",
      url: "https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
