import type { CodingRule } from "../../types";

export const tq002Rule = {
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
  bad: {
    language: "ts",
    code: 'const queryKey = ["todos", () => status];',
  },
  good: {
    language: "ts",
    code: 'const queryKey = ["todos", { page, status }];',
  },
  references: [
    {
      label: "TanStack Query — Query Keys",
      url: "https://tanstack.com/query/latest/docs/framework/react/guides/query-keys",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
