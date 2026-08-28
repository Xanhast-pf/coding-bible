#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const examplesByFile = {
  "packages/rules/src/rules/react.ts": {
    "REACT-001": {
      bad: {
        language: "tsx",
        code: `const Checkout = ({ cart }) => {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price, 0);
  const total = subtotal + calculateTax(subtotal);

  return <CheckoutSummary total={total} />;
};`,
      },
      good: {
        language: "tsx",
        code: `const Checkout = ({ cart }) => {
  const summary = useCheckoutSummary(cart);

  return <CheckoutSummary summary={summary} />;
};`,
      },
    },
    "REACT-002": {
      bad: {
        language: "tsx",
        code: `const fullName = useMemo(() => \`${'${firstName}'} ${'${lastName}'}\`, [firstName, lastName]);`,
      },
      good: {
        language: "tsx",
        code: `const fullName = \`${'${firstName}'} ${'${lastName}'}\`;`,
      },
    },
    "REACT-003": {
      bad: {
        language: "tsx",
        code: `// Global store for state owned by one component
const modalStore = createStore({ isOpen: false });`,
      },
      good: {
        language: "tsx",
        code: `const [isOpen, setIsOpen] = useState(false);`,
      },
    },
    "REACT-005": {
      bad: {
        language: "tsx",
        code: `const [shouldSave, setShouldSave] = useState(false);

useEffect(() => {
  if (shouldSave) saveForm(form);
}, [form, shouldSave]);`,
      },
      good: {
        language: "tsx",
        code: `const handleSave = () => {
  saveForm(form);
};`,
      },
    },
    "REACT-007": {
      bad: {
        language: "tsx",
        code: `const UserCard = ({ user }) => {
  analytics.track("UserCard rendered", { userId: user.id });
  return <h2>{user.name}</h2>;
};`,
      },
      good: {
        language: "tsx",
        code: `const UserCard = ({ user }) => {
  useEffect(() => {
    analytics.track("UserCard viewed", { userId: user.id });
  }, [user.id]);

  return <h2>{user.name}</h2>;
};`,
      },
    },
    "REACT-008": {
      bad: {
        language: "tsx",
        code: `const CountrySelect = () => {
  const options = ["Canada", "France", "Japan"];
  return <Select options={options} />;
};`,
      },
      good: {
        language: "tsx",
        code: `const countryOptions = ["Canada", "France", "Japan"];

const CountrySelect = () => <Select options={countryOptions} />;`,
      },
    },
    "REACT-009": {
      bad: {
        language: "tsx",
        code: `if (isEnabled) {
  const [count, setCount] = useState(0);
}`, 
      },
      good: {
        language: "tsx",
        code: `const [count, setCount] = useState(0);

if (!isEnabled) return null;`,
      },
    },
    "REACT-011": {
      bad: {
        language: "tsx",
        code: `const UserName = ({ user }) => {
  user.name = user.name.trim();
  return <span>{user.name}</span>;
};`,
      },
      good: {
        language: "tsx",
        code: `const UserName = ({ user }) => {
  const displayName = user.name.trim();
  return <span>{displayName}</span>;
};`,
      },
    },
    "REACT-012": {
      bad: {
        language: "tsx",
        code: `useEffect(() => {
  loadUser(userId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);`,
      },
      good: {
        language: "tsx",
        code: `useEffect(() => {
  loadUser(userId);
}, [userId]);`,
      },
    },
    "REACT-013": {
      bad: {
        language: "tsx",
        code: `const Dashboard = () => {
  const billing = useBilling();
  const notifications = useNotifications();
  const search = useSearch();

  return <DashboardView {...{ billing, notifications, search }} />;
};`,
      },
      good: {
        language: "tsx",
        code: `const Dashboard = () => (
  <>
    <BillingPanel />
    <NotificationsPanel />
    <SearchPanel />
  </>
);`,
        note: "Split by coherent responsibility, not because a file crossed an arbitrary line count.",
      },
    },
  },

  "packages/rules/src/rules/legendState.ts": {
    "LEGEND-002": {
      bad: {
        language: "ts",
        code: `const userId = session$.userId.get();
analytics.track("checkout", { userId });`,
      },
      good: {
        language: "ts",
        code: `const userId = session$.userId.peek();
analytics.track("checkout", { userId });`,
        note: "peek() makes the intentional non-reactive read explicit.",
      },
    },
    "LEGEND-003": {
      bad: {
        language: "ts",
        code: `const profile = store$.profile.peek();
profile.name = "Ada";
store$.profile.set(profile);`,
      },
      good: {
        language: "ts",
        code: `store$.profile.name.set("Ada");`,
      },
    },
    "LEGEND-004": {
      bad: {
        language: "ts",
        code: `store$.data.set(response.data);
store$.isLoading.set(false);`,
      },
      good: {
        language: "ts",
        code: `store$.assign({
  data: response.data,
  isLoading: false,
});`,
      },
    },
    "LEGEND-005": {
      bad: {
        language: "tsx",
        code: `const state = useValue(store$);
return <Badge>{state.notifications.unread}</Badge>;`,
      },
      good: {
        language: "tsx",
        code: `const unread = useValue(store$.notifications.unread);
return <Badge>{unread}</Badge>;`,
      },
    },
    "LEGEND-006": {
      bad: {
        language: "ts",
        code: `store$.session.set({
  lastSeen: new Date(),
  onClose: closeSession,
});`,
      },
      good: {
        language: "ts",
        code: `store$.session.set({
  lastSeenIso: new Date().toISOString(),
});`,
        note: "Use plain values for observable nodes that are persisted, synchronized, or transported.",
      },
    },
  },

  "packages/rules/src/rules/redux.ts": {
    "REDUX-001": {
      bad: {
        language: "ts",
        code: `const reducer = (state = initialState, action) => {
  switch (action.type) {
    case "todos/todoAdded":
      return { ...state, todos: [...state.todos, action.payload] };
    default:
      return state;
  }
};`,
      },
      good: {
        language: "ts",
        code: `const todosSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    todoAdded(state, action) {
      state.todos.push(action.payload);
    },
  },
});`,
      },
    },
    "REDUX-002": {
      bad: {
        language: "ts",
        code: `markUpdated(state) {
  state.lastUpdated = Date.now();
}`, 
      },
      good: {
        language: "ts",
        code: `markUpdated(state, action: PayloadAction<number>) {
  state.lastUpdated = action.payload;
}

dispatch(markUpdated(Date.now()));`,
      },
    },
    "REDUX-003": {
      bad: {
        language: "ts",
        code: `dispatch(userLoaded({
  loadedAt: new Date(),
  user,
}));`,
      },
      good: {
        language: "ts",
        code: `dispatch(userLoaded({
  loadedAtIso: new Date().toISOString(),
  user,
}));`,
      },
    },
    "REDUX-004": {
      bad: {
        language: "ts",
        code: `const initialState = {
  todos: [],
  visibleTodos: [],
};`,
      },
      good: {
        language: "ts",
        code: `const initialState = { todos: [] };

const selectVisibleTodos = (state) =>
  state.todos.filter((todo) => !todo.completed);`,
      },
    },
    "REDUX-005": {
      bad: {
        language: "ts",
        code: `const posts = [
  { id: "p1", author: { id: "u1", name: "Ada" } },
  { id: "p2", author: { id: "u1", name: "Ada" } },
];`,
      },
      good: {
        language: "ts",
        code: `const state = {
  authors: { byId: { u1: { id: "u1", name: "Ada" } } },
  posts: { byId: { p1: { id: "p1", authorId: "u1" } } },
};`,
      },
    },
    "REDUX-006": {
      bad: {
        language: "tsx",
        code: `const currency = useSelector(
  (state) => state.account.preferences.checkout.currency,
);`,
      },
      good: {
        language: "tsx",
        code: `const selectCheckoutCurrency = (state) =>
  state.account.preferences.checkout.currency;

const currency = useSelector(selectCheckoutCurrency);`,
      },
    },
    "REDUX-007": {
      bad: {
        language: "ts",
        code: `const selectUserName = createSelector(
  [(state) => state.user.name],
  (name) => name,
);`,
      },
      good: {
        language: "ts",
        code: `const selectUserName = (state) => state.user.name;`,
      },
    },
    "REDUX-008": {
      bad: {
        language: "tsx",
        code: `<input
  value={name}
  onChange={(event) => dispatch(nameChanged(event.target.value))}
/>`,
      },
      good: {
        language: "tsx",
        code: `const [name, setName] = useState("");

<input value={name} onChange={(event) => setName(event.target.value)} />`,
      },
    },
    "REDUX-009": {
      bad: {
        language: "ts",
        code: `export const userStore = configureStore({ reducer: userReducer });
export const settingsStore = configureStore({ reducer: settingsReducer });`,
      },
      good: {
        language: "ts",
        code: `export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    user: userReducer,
  },
});`,
      },
    },
    "REDUX-010": {
      bad: {
        language: "text",
        code: `src/
  actions/users.ts
  reducers/users.ts
  selectors/users.ts`,
      },
      good: {
        language: "text",
        code: `src/
  features/users/
    usersSlice.ts
    usersSelectors.ts`,
      },
    },
    "REDUX-011": {
      bad: {
        language: "ts",
        code: `const fetchTodos = createAsyncThunk("todos/fetch", fetchTodosApi);

// Slice also tracks request status, cache lifetime, and refetch logic.`,
      },
      good: {
        language: "ts",
        code: `const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (build) => ({
    getTodos: build.query<Todo[], void>({ query: () => "todos" }),
  }),
});`,
      },
    },
  },

  "packages/rules/src/rules/graphql.ts": {
    "GQL-001": {
      bad: {
        language: "graphql",
        code: `query {
  viewer { id name }
}`,
      },
      good: {
        language: "graphql",
        code: `query ViewerQuery {
  viewer { id name }
}`,
      },
    },
    "GQL-002": {
      bad: {
        language: "ts",
        code: `const document = gql\`
  query UserQuery {
    user(id: "${'${userId}'}") { id name }
  }
\`;`,
      },
      good: {
        language: "ts",
        code: `const document = gql\`
  query UserQuery($id: ID!) {
    user(id: $id) { id name }
  }
\`;

useQuery(document, { variables: { id: userId } });`,
      },
    },
    "GQL-003": {
      bad: {
        language: "graphql",
        code: `query DashboardQuery {
  viewer { id name avatarUrl }
  owner { id name avatarUrl }
}`,
      },
      good: {
        language: "graphql",
        code: `fragment UserSummary on User {
  id
  name
  avatarUrl
}

query DashboardQuery {
  viewer { ...UserSummary }
  owner { ...UserSummary }
}`,
      },
    },
    "GQL-004": {
      bad: {
        language: "sh",
        code: `pnpm type-check
# GraphQL documents are never checked against the schema`,
      },
      good: {
        language: "sh",
        code: `pnpm graphql:validate
pnpm type-check`,
        note: "Use schema-aware validation or code generation in CI; the exact command depends on the project toolchain.",
      },
    },
    "GQL-005": {
      bad: {
        language: "ts",
        code: `// Schema: nickname: String
type User = { nickname: string };`,
      },
      good: {
        language: "ts",
        code: `// Schema: nickname: String
type User = { nickname: string | null };`,
      },
    },
    "GQL-006": {
      bad: {
        language: "graphql",
        code: `query UsersQuery {
  users { id name }
}`,
      },
      good: {
        language: "graphql",
        code: `query UsersQuery($after: String, $first: Int!) {
  users(after: $after, first: $first) {
    edges { node { id name } }
    pageInfo { endCursor hasNextPage }
  }
}`,
      },
    },
  },

  "packages/rules/src/rules/apollo.ts": {
    "APOLLO-001": {
      bad: {
        language: "ts",
        code: `// Product has sku, but no id/_id.
const cache = new InMemoryCache();`,
      },
      good: {
        language: "ts",
        code: `const cache = new InMemoryCache({
  typePolicies: {
    Product: { keyFields: ["sku"] },
  },
});`,
      },
    },
    "APOLLO-002": {
      bad: {
        language: "ts",
        code: `const client = new ApolloClient({
  cache,
  defaultOptions: {
    watchQuery: { fetchPolicy: "network-only" },
  },
});`,
      },
      good: {
        language: "tsx",
        code: `useQuery(GET_PROFILE, {
  fetchPolicy: "cache-and-network",
  nextFetchPolicy: "cache-first",
});`,
        note: "Choose a policy per freshness requirement; this is one example, not a universal default.",
      },
    },
    "APOLLO-003": {
      bad: {
        language: "graphql",
        code: `mutation RenameUser($id: ID!, $name: String!) {
  renameUser(id: $id, name: $name) {
    success
  }
}`,
      },
      good: {
        language: "graphql",
        code: `mutation RenameUser($id: ID!, $name: String!) {
  renameUser(id: $id, name: $name) {
    user { id name }
  }
}`,
      },
    },
    "APOLLO-004": {
      bad: {
        language: "tsx",
        code: `await deleteTodo({ variables: { id } });
// GET_TODOS may still contain the deleted item.`,
      },
      good: {
        language: "tsx",
        code: `await deleteTodo({
  variables: { id },
  refetchQueries: [{ query: GET_TODOS }],
});`,
      },
    },
    "APOLLO-005": {
      bad: {
        language: "tsx",
        code: `const nextPage = await fetchMore({ variables: { offset: items.length } });
setItems((items) => [...items, ...nextPage.data.feed]);`,
      },
      good: {
        language: "ts",
        code: `const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        feed: offsetLimitPagination(),
      },
    },
  },
});`,
      },
    },
    "APOLLO-006": {
      bad: {
        language: "tsx",
        code: `const { data } = useQuery(DASHBOARD_QUERY, {
  errorPolicy: "ignore",
});`,
      },
      good: {
        language: "tsx",
        code: `const { data, error } = useQuery(DASHBOARD_QUERY, {
  errorPolicy: "all",
});

if (error && !data) return <ErrorState />;
return <Dashboard data={data} warning={error?.message} />;`,
      },
    },
  },

  "packages/rules/src/rules/tanstackQuery.ts": {
    "TQ-001": {
      bad: {
        language: "tsx",
        code: `useQuery({
  queryKey: ["todo"],
  queryFn: () => fetchTodo(todoId),
});`,
      },
      good: {
        language: "tsx",
        code: `useQuery({
  queryKey: ["todo", todoId],
  queryFn: () => fetchTodo(todoId),
});`,
      },
    },
    "TQ-002": {
      bad: {
        language: "ts",
        code: `const queryKey = ["todos", () => status];`,
      },
      good: {
        language: "ts",
        code: `const queryKey = ["todos", { page, status }];`,
      },
    },
    "TQ-003": {
      bad: {
        language: "ts",
        code: `const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  },
});`,
      },
      good: {
        language: "tsx",
        code: `const catalogStaleTimeMs = 5 * 60 * 1000;

useQuery({
  queryKey: ["catalog"],
  queryFn: fetchCatalog,
  staleTime: catalogStaleTimeMs,
});`,
      },
    },
    "TQ-004": {
      bad: {
        language: "tsx",
        code: `useMutation({
  mutationFn: addTodo,
});`,
      },
      good: {
        language: "tsx",
        code: `useMutation({
  mutationFn: addTodo,
  onSuccess: () =>
    queryClient.invalidateQueries({ queryKey: ["todos"] }),
});`,
      },
    },
    "TQ-005": {
      bad: {
        language: "ts",
        code: `const fetchTodos = async () => {
  const response = await fetch("/api/todos");
  return response.json();
};`,
      },
      good: {
        language: "ts",
        code: `const fetchTodos = async () => {
  const response = await fetch("/api/todos");
  if (!response.ok) throw new Error("Failed to load todos");
  return response.json();
};`,
      },
    },
  },

  "packages/rules/src/rules/nextjs.ts": {
    "NEXT-001": {
      bad: {
        language: "tsx",
        code: `"use client";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  useEffect(() => void fetch("/api/users").then(/* ... */), []);
  return <Users users={users} />;
};`,
      },
      good: {
        language: "tsx",
        code: `const UsersPage = async () => {
  const users = await getUsers();
  return <Users users={users} />;
};`,
      },
    },
    "NEXT-002": {
      bad: {
        language: "tsx",
        code: `"use client";

export default function Dashboard() {
  return <LargeDashboardWithOneInteractiveButton />;
}`, 
      },
      good: {
        language: "tsx",
        code: `// Dashboard.tsx — Server Component
export default function Dashboard() {
  return <FavoriteButton />;
}

// FavoriteButton.tsx
"use client";`,
      },
    },
    "NEXT-003": {
      bad: {
        language: "tsx",
        code: `// Server Component
const formatPrice = (value: number) => \`$${'${value}'}\`;
return <ClientPrice amount={12} formatPrice={formatPrice} />;`,
      },
      good: {
        language: "tsx",
        code: `// Server Component
return <ClientPrice amount={12} currency="USD" />;`,
        note: "Pass serializable data and keep ordinary client behavior inside the Client Component.",
      },
    },
    "NEXT-004": {
      bad: {
        language: "ts",
        code: `export const getUsers = () => db.user.findMany();
export const apiSecret = process.env.API_SECRET;`,
      },
      good: {
        language: "ts",
        code: `import "server-only";

export const getUsers = () => db.user.findMany();`,
      },
    },
    "NEXT-005": {
      bad: {
        language: "tsx",
        code: `export default async function UsersPage() {
  const response = await fetch("https://my-app.test/api/users");
  const users = await response.json();
  return <Users users={users} />;
}`, 
      },
      good: {
        language: "tsx",
        code: `export default async function UsersPage() {
  const users = await getUsers();
  return <Users users={users} />;
}`, 
      },
    },
    "NEXT-006": {
      bad: {
        language: "ts",
        code: `const user = await getUser();
const posts = await getPosts();`,
      },
      good: {
        language: "ts",
        code: `const [posts, user] = await Promise.all([
  getPosts(),
  getUser(),
]);`,
      },
    },
  },
};

const formatExample = (label, example) => {
  const lines = [
    `    ${label}: {`,
    `      language: ${JSON.stringify(example.language)},`,
    `      code: ${JSON.stringify(example.code)},`,
  ];

  if (example.note) {
    lines.push(`      note: ${JSON.stringify(example.note)},`);
  }

  lines.push("    },");
  return lines.join("\n");
};

const insertExamples = (source, ruleId, examples) => {
  const marker = `    id: "${ruleId}",`;
  const ruleStart = source.indexOf(marker);

  if (ruleStart === -1) {
    throw new Error(`Could not find ${ruleId}`);
  }

  const nextRule = source.indexOf('\n  {\n    id: "', ruleStart + marker.length);
  const arrayEnd = source.indexOf("\n] satisfies readonly CodingRule[];", ruleStart);
  const ruleEnd = nextRule === -1 ? arrayEnd : nextRule;

  if (ruleEnd === -1) {
    throw new Error(`Could not determine the end of ${ruleId}`);
  }

  const block = source.slice(ruleStart, ruleEnd);
  const alreadyHasBad = block.includes("\n    bad:");
  const alreadyHasGood = block.includes("\n    good:");

  if (alreadyHasBad || alreadyHasGood) {
    if (alreadyHasBad && alreadyHasGood) return { source, skipped: true };
    throw new Error(`${ruleId} has only one side of the example pair`);
  }

  const tagsMatch = block.match(/\n    tags: \[[^\n]+\],/);
  if (!tagsMatch || tagsMatch.index === undefined) {
    throw new Error(`Could not find the tags line for ${ruleId}`);
  }

  const insertAt = ruleStart + tagsMatch.index + tagsMatch[0].length;
  const exampleBlock = `\n${formatExample("bad", examples.bad)}\n${formatExample("good", examples.good)}`;

  return {
    source: source.slice(0, insertAt) + exampleBlock + source.slice(insertAt),
    skipped: false,
  };
};

const rootArg = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
const root = resolve(rootArg ?? process.cwd());
const shouldFormat = !process.argv.includes("--no-format");
const changedFiles = [];
let addedPairs = 0;
let skippedPairs = 0;

for (const [relativePath, examples] of Object.entries(examplesByFile)) {
  const absolutePath = resolve(root, relativePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Missing ${relativePath}. Run this script from the coding-bible repo root.`);
  }

  let source = readFileSync(absolutePath, "utf8");

  for (const [ruleId, pair] of Object.entries(examples)) {
    const result = insertExamples(source, ruleId, pair);
    source = result.source;
    if (result.skipped) skippedPairs += 1;
    else addedPairs += 1;
  }

  writeFileSync(absolutePath, source);
  changedFiles.push(relativePath);
}

console.log(`Added ${addedPairs} DON’T / DO pairs; skipped ${skippedPairs} rules that already had both examples.`);
console.log(`Touched ${changedFiles.length} ecosystem rule files.`);

if (shouldFormat && changedFiles.length > 0) {
  const result = spawnSync(
    "pnpm",
    ["exec", "biome", "check", "--write", ...changedFiles],
    {
      cwd: root,
      encoding: "utf8",
      shell: process.platform === "win32",
      stdio: "inherit",
    },
  );

  if (result.error || result.status !== 0) {
    console.warn("Biome formatting did not complete. Run `pnpm check --write` (or the repo's Biome write command) before committing.");
  }
}
