import type { CodingRule } from "../../types";

export const redux001Rule = {
  id: "REDUX-001",
  title: "Use Redux Toolkit for modern Redux",
  summary:
    "Prefer configureStore, createSlice, createAsyncThunk, RTK Query, and other Redux Toolkit APIs over hand-written legacy Redux boilerplate.",
  rationale:
    "Redux Toolkit is the official recommended toolset and encodes safer defaults for immutable updates, DevTools, and store configuration.",
  level: "should",
  pack: "redux",
  status: "stable",
  tags: ["redux", "redux-toolkit"],
  bad: {
    language: "ts",
    code: 'const reducer = (state = initialState, action) => {\n  switch (action.type) {\n    case "todos/todoAdded":\n      return { ...state, todos: [...state.todos, action.payload] };\n    default:\n      return state;\n  }\n};',
  },
  good: {
    language: "ts",
    code: 'const todosSlice = createSlice({\n  name: "todos",\n  initialState,\n  reducers: {\n    todoAdded(state, action) {\n      state.todos.push(action.payload);\n    },\n  },\n});',
  },
  references: [
    {
      label: "Redux — Style Guide",
      url: "https://redux.js.org/style-guide/",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
