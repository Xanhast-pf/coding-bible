import type { CodingRule } from "../../types";

export const redux002Rule = {
  id: "REDUX-002",
  title: "Keep reducers pure",
  summary:
    "Reducers must not perform async work, generate nondeterministic values, mutate external variables, or trigger side effects.",
  rationale:
    "Redux may replay reducer logic for debugging and hot reload; deterministic pure reducers make state transitions reproducible.",
  level: "must",
  pack: "redux",
  status: "stable",
  tags: ["purity", "reducers", "redux"],
  bad: {
    language: "ts",
    code: "markUpdated(state) {\n  state.lastUpdated = Date.now();\n}",
  },
  good: {
    language: "ts",
    code: "markUpdated(state, action: PayloadAction<number>) {\n  state.lastUpdated = action.payload;\n}\n\ndispatch(markUpdated(Date.now()));",
  },
  references: [
    {
      label: "Redux — Style Guide",
      url: "https://redux.js.org/style-guide/",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
