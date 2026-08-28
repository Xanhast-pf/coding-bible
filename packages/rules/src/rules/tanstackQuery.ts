import type { CodingRule } from "../types";

export const tanstackQueryRules = [
  {
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
    references: [
      {
        label: "TanStack Query — Query Keys",
        url: "https://tanstack.com/query/latest/docs/framework/react/guides/query-keys",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
    id: "TQ-002",
    title: "Keep query keys serializable and deterministic",
    summary:
      "Use stable serializable values that uniquely describe the requested server data.",
    rationale:
      "TanStack Query hashes query keys to identify cached results; unstable or non-serializable identity makes caching unpredictable.",
    level: "must",
    pack: "tanstack-query",
    status: "stable",
    tags: ["cache", "query-keys", "serialization", "tanstack-query"],
    references: [
      {
        label: "TanStack Query — Query Keys",
        url: "https://tanstack.com/query/latest/docs/framework/react/guides/query-keys",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
    references: [
      {
        label: "TanStack Query — Important Defaults",
        url: "https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
    references: [
      {
        label: "TanStack Query — Invalidations from Mutations",
        url: "https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "TQ-005",
    title: "Make query functions reject failed requests",
    summary:
      "A query function must throw or return a rejected Promise for failures; clients such as fetch need an explicit non-OK response check.",
    rationale:
      "TanStack Query determines error state from rejected query functions. Returning an error response as successful data bypasses retry and error handling.",
    level: "must",
    pack: "tanstack-query",
    status: "stable",
    tags: ["errors", "query-functions", "tanstack-query"],
    references: [
      {
        label: "TanStack Query — Query Functions",
        url: "https://tanstack.com/query/latest/docs/framework/react/guides/query-functions",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
