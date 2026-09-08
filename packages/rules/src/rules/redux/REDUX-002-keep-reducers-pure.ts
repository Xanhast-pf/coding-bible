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
    code: 'createSlice({\n  name: "meta",\n  initialState,\n  reducers: {\n    markUpdated(state) {\n      state.lastUpdated = Date.now();\n    },\n  },\n});',
  },
  good: {
    language: "ts",
    code: 'const metaSlice = createSlice({\n  name: "meta",\n  initialState,\n  reducers: {\n    markUpdated(state, action: PayloadAction<number>) {\n      state.lastUpdated = action.payload;\n    },\n  },\n});\n\ndispatch(metaSlice.actions.markUpdated(Date.now()));',
  },
  references: [
    {
      label: "Redux — Style Guide",
      url: "https://redux.js.org/style-guide/",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
