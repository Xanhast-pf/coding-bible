import type { CodingRule } from "../../types";

export const redux011Rule = {
  id: "REDUX-011",
  title: "Prefer RTK Query for server data in Redux applications",
  summary:
    "When Redux is already the application state platform, use RTK Query as the default server fetching and caching layer instead of hand-writing request/cache reducers.",
  rationale:
    "RTK Query provides request deduplication, caching, loading state, invalidation, and generated hooks while following Redux's recommended architecture.",
  level: "should",
  pack: "redux",
  status: "stable",
  tags: ["data-fetching", "redux", "rtk-query", "server-state"],
  bad: {
    language: "ts",
    code: 'const fetchTodos = createAsyncThunk("todos/fetch", fetchTodosApi);\n\n// Slice also tracks request status, cache lifetime, and refetch logic.',
  },
  good: {
    language: "ts",
    code: 'const api = createApi({\n  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),\n  endpoints: (build) => ({\n    getTodos: build.query<Todo[], void>({ query: () => "todos" }),\n  }),\n});',
  },
  references: [
    {
      label: "Redux — Style Guide",
      url: "https://redux.js.org/style-guide/",
    },
    {
      label: "Redux Toolkit — Automated Re-fetching",
      url: "https://redux-toolkit.js.org/rtk-query/usage/automated-refetching",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
