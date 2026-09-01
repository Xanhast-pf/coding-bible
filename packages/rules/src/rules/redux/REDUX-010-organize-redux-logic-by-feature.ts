import type { CodingRule } from "../../types";

export const redux010Rule = {
  id: "REDUX-010",
  title: "Organize Redux logic by feature",
  summary:
    "Keep a feature's reducer logic, actions, and selectors close together, typically in a Redux Toolkit slice, instead of separating the app into global actions/reducers folders.",
  rationale:
    "Feature-oriented slices improve cohesion and make the code that changes together easier to find and maintain.",
  level: "should",
  pack: "redux",
  status: "stable",
  tags: ["architecture", "features", "redux", "slices"],
  bad: {
    language: "text",
    code: "src/\n  actions/users.ts\n  reducers/users.ts\n  selectors/users.ts",
  },
  good: {
    language: "text",
    code: "src/\n  features/users/\n    usersSlice.ts\n    usersSelectors.ts",
  },
  references: [
    {
      label: "Redux — Style Guide",
      url: "https://redux.js.org/style-guide/",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
