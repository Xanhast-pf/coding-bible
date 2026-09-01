import type { CodingRule } from "../../types";

export const tq003Rule = {
  id: "TQ-003",
  title: "Configure freshness instead of fighting refetch behavior",
  summary:
    "Understand staleTime and the default refetch triggers before disabling mount, focus, or reconnect refetching globally.",
  rationale:
    "TanStack Query considers cached data stale by default and refetches stale queries at useful lifecycle points; staleTime is the primary control for expected freshness.",
  level: "should",
  pack: "tanstack-query",
  status: "stable",
  tags: ["freshness", "refetch", "stale-time", "tanstack-query"],
  bad: {
    language: "ts",
    code: "const queryClient = new QueryClient({\n  defaultOptions: {\n    queries: {\n      refetchOnMount: false,\n      refetchOnReconnect: false,\n      refetchOnWindowFocus: false,\n    },\n  },\n});",
  },
  good: {
    language: "tsx",
    code: 'const catalogStaleTimeMs = 5 * 60 * 1000;\n\nuseQuery({\n  queryKey: ["catalog"],\n  queryFn: fetchCatalog,\n  staleTime: catalogStaleTimeMs,\n});',
  },
  references: [
    {
      label: "TanStack Query — Important Defaults",
      url: "https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
