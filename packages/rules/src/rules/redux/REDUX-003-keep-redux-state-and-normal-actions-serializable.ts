import type { CodingRule } from "../../types";

export const redux003Rule = {
  id: "REDUX-003",
  title: "Keep Redux state and normal actions serializable",
  summary:
    "Avoid Promises, functions, class instances, Maps/Sets, DOM nodes, and other non-serializable values in Redux state or actions that reach reducers.",
  rationale:
    "Serializable data preserves DevTools, persistence, replay, predictable equality behavior, and debugging.",
  level: "must",
  pack: "redux",
  status: "stable",
  tags: ["redux", "serialization", "state"],
  bad: {
    language: "ts",
    code: "dispatch(userLoaded({\n  loadedAt: new Date(),\n  user,\n}));",
  },
  good: {
    language: "ts",
    code: "dispatch(userLoaded({\n  loadedAtIso: new Date().toISOString(),\n  user,\n}));",
  },
  exceptions: [
    "Middleware may intentionally intercept a non-serializable action before it reaches reducers.",
  ],
  references: [
    {
      label: "Redux — Style Guide",
      url: "https://redux.js.org/style-guide/",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
