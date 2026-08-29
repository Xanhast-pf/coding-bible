import type { CodingRule } from "../types";

export const reduxRules = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
    id: "REDUX-005",
    title: "Normalize complex relational collections",
    summary:
      "Store heavily relational or repeatedly updated entity data in a normalized shape, typically with createEntityAdapter.",
    rationale:
      "Normalization makes entity lookup and single-item updates simpler and reduces duplicated nested copies of the same entity.",
    level: "should",
    pack: "redux",
    status: "stable",
    tags: ["entities", "normalization", "redux"],
    bad: {
      language: "ts",
      code: 'const posts = [\n  { id: "p1", author: { id: "u1", name: "Ada" } },\n  { id: "p2", author: { id: "u1", name: "Ada" } },\n];',
    },
    good: {
      language: "ts",
      code: 'const state = {\n  authors: { byId: { u1: { id: "u1", name: "Ada" } } },\n  posts: { byId: { p1: { id: "p1", authorId: "u1" } } },\n};',
    },
    references: [
      {
        label: "Redux — Normalizing State Shape",
        url: "https://redux.js.org/usage/structuring-reducers/normalizing-state-shape",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "REDUX-006",
    title: "Use selectors to encapsulate state shape",
    summary:
      "Reusable consumers should ask selectors for domain values instead of spreading knowledge of deep store paths throughout the UI.",
    rationale:
      "Selectors create a stable read boundary so state structure can change without rewriting every consumer.",
    level: "should",
    pack: "redux",
    status: "stable",
    tags: ["encapsulation", "redux", "selectors"],
    bad: {
      language: "tsx",
      code: "const currency = useSelector(\n  (state) => state.account.preferences.checkout.currency,\n);",
    },
    good: {
      language: "tsx",
      code: "const selectCheckoutCurrency = (state) =>\n  state.account.preferences.checkout.currency;\n\nconst currency = useSelector(selectCheckoutCurrency);",
    },
    references: [
      {
        label: "Redux — Deriving Data with Selectors",
        url: "https://redux.js.org/usage/deriving-data-selectors",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
  },
  {
    id: "REDUX-008",
    title: "Keep transient UI and form state local by default",
    summary:
      "Do not put temporary form edits, hover state, or component-local interaction state in Redux without a genuine cross-application ownership need.",
    rationale:
      "Local state keeps ownership close to the UI and avoids dispatching global actions for data that is neither shared nor cached.",
    level: "prefer",
    pack: "redux",
    status: "stable",
    tags: ["forms", "redux", "state"],
    bad: {
      language: "tsx",
      code: "<input\n  value={name}\n  onChange={(event) => dispatch(nameChanged(event.target.value))}\n/>",
    },
    good: {
      language: "tsx",
      code: 'const [name, setName] = useState("");\n\n<input value={name} onChange={(event) => setName(event.target.value)} />',
    },
    references: [
      {
        label: "Redux — Style Guide",
        url: "https://redux.js.org/style-guide/",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
  },
  {
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
  },
  {
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
  },
] satisfies readonly CodingRule[];
