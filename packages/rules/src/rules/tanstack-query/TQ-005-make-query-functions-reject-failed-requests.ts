import type { CodingRule } from "../../types";

export const tq005Rule = {
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
  bad: {
    language: "ts",
    code: 'const fetchTodos = async () => {\n  const response = await fetch("/api/todos");\n  return response.json();\n};',
  },
  good: {
    language: "ts",
    code: 'const fetchTodos = async () => {\n  const response = await fetch("/api/todos");\n  if (!response.ok) throw new Error("Failed to load todos");\n  return response.json();\n};',
  },
  references: [
    {
      label: "TanStack Query — Query Functions",
      url: "https://tanstack.com/query/latest/docs/framework/react/guides/query-functions",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
