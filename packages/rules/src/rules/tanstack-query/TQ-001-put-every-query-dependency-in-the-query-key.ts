import type { CodingRule } from "../../types";

export const tq001Rule = {
  id: "TQ-001",
  title: "Put every query dependency in the query key",
  summary:
    "If the query function changes its result based on a variable, include that variable in the query key.",
  rationale:
    "The query key is TanStack Query's cache identity and dependency list; omitting an input can return or overwrite data under the wrong cache entry.",
  level: "must",
  pack: "tanstack-query",
  status: "stable",
  tags: ["cache", "query-keys", "tanstack-query"],
  bad: {
    language: "tsx",
    code: 'const useTodo = (todoId: string) =>\n  useQuery({\n    queryKey: ["todo"],\n    queryFn: () => fetchTodo(todoId),\n  });',
  },
  good: {
    language: "tsx",
    code: 'const useTodo = (todoId: string) =>\n  useQuery({\n    queryKey: ["todo", todoId],\n    queryFn: () => fetchTodo(todoId),\n  });',
  },
  references: [
    {
      label: "TanStack Query — Query Keys",
      url: "https://tanstack.com/query/latest/docs/framework/react/guides/query-keys",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
