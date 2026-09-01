import type { CodingRule } from "../../types";

export const redux009Rule = {
  id: "REDUX-009",
  title: "Use one Redux store per application",
  summary:
    "A standard Redux application should have one configured store instance shared through the application boundary.",
  rationale:
    "A single store preserves one state graph, one dispatch pipeline, and predictable DevTools/debugging behavior.",
  level: "must",
  pack: "redux",
  status: "stable",
  tags: ["architecture", "redux", "store"],
  bad: {
    language: "ts",
    code: "export const userStore = configureStore({ reducer: userReducer });\nexport const settingsStore = configureStore({ reducer: settingsReducer });",
  },
  good: {
    language: "ts",
    code: "export const store = configureStore({\n  reducer: {\n    settings: settingsReducer,\n    user: userReducer,\n  },\n});",
  },
  references: [
    {
      label: "Redux — Style Guide",
      url: "https://redux.js.org/style-guide/",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
