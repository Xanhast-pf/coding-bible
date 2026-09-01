import type { CodingRule } from "../../types";

export const redux004Rule = {
  id: "REDUX-004",
  title: "Keep Redux state minimal and derive the rest",
  summary:
    "Store canonical source data and derive filtered, aggregated, or presentation-ready values through selectors.",
  rationale:
    "Duplicated derived state introduces synchronization bugs and makes updates more complicated than recalculating from the source.",
  level: "must",
  pack: "redux",
  status: "stable",
  tags: ["derived-state", "redux", "selectors"],
  bad: {
    language: "ts",
    code: "const initialState = {\n  todos: [],\n  visibleTodos: [],\n};",
  },
  good: {
    language: "ts",
    code: "const initialState = { todos: [] };\n\nconst selectVisibleTodos = (state) =>\n  state.todos.filter((todo) => !todo.completed);",
  },
  references: [
    {
      label: "Redux — Deriving Data with Selectors",
      url: "https://redux.js.org/usage/deriving-data-selectors",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
