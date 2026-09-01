import type { CodingRule } from "../../types";

export const redux007Rule = {
  id: "REDUX-007",
  title:
    "Memoize selectors only when they derive expensive or referentially new values",
  summary:
    "Do not wrap every direct state lookup in createSelector; reserve memoization for real derivation or stable-reference needs.",
  rationale:
    "Unnecessary selector memoization adds complexity without avoiding work, while derived arrays and expensive calculations can benefit substantially.",
  level: "prefer",
  pack: "redux",
  status: "stable",
  tags: ["memoization", "redux", "selectors"],
  bad: {
    language: "ts",
    code: "const selectUserName = createSelector(\n  [(state) => state.user.name],\n  (name) => name,\n);",
  },
  good: {
    language: "ts",
    code: "const selectUserName = (state) => state.user.name;",
  },
  references: [
    {
      label: "Redux — Deriving Data with Selectors",
      url: "https://redux.js.org/usage/deriving-data-selectors",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
