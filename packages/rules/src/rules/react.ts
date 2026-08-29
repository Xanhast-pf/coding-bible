import type { CodingRule } from "../types";

export const reactRules = [
  {
    id: "REACT-001",
    title: "Keep components focused on presentation",
    summary:
      "Move substantial transformation, orchestration, and business logic out of component markup.",
    rationale:
      "Separating presentation from behavior keeps components readable and makes logic independently testable.",
    level: "should",
    pack: "react",
    status: "stable",
    tags: ["architecture", "components", "separation-of-concerns"],
    bad: {
      language: "tsx",
      code: "const Checkout = ({ cart }) => {\n  const subtotal = cart.items.reduce((sum, item) => sum + item.price, 0);\n  const total = subtotal + calculateTax(subtotal);\n\n  return <CheckoutSummary total={total} />;\n};",
    },
    good: {
      language: "tsx",
      code: "const Checkout = ({ cart }) => {\n  const summary = useCheckoutSummary(cart);\n\n  return <CheckoutSummary summary={summary} />;\n};",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "REACT-002",
    title: "Do not memoize by reflex",
    summary:
      "Use memoization when identity matters or profiling demonstrates a meaningful benefit.",
    rationale:
      "Unnecessary memoization adds dependency management and cognitive overhead without guaranteed benefit.",
    level: "prefer",
    pack: "react",
    status: "stable",
    tags: ["performance", "react"],
    bad: {
      language: "tsx",
      code: "const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);",
    },
    good: {
      language: "tsx",
      code: "const fullName = `${firstName} ${lastName}`;",
    },
    references: [
      {
        label: "React — useMemo",
        url: "https://react.dev/reference/react/useMemo",
      },
      {
        label: "React — React Compiler",
        url: "https://react.dev/learn/react-compiler",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "REACT-003",
    title: "Keep state as local as practical",
    summary:
      "Use explicit props and local state until multiple consumers genuinely require shared ownership.",
    rationale:
      "Global state hides dependencies. Local state and explicit data flow make ownership easier to understand.",
    level: "prefer",
    pack: "react",
    status: "stable",
    tags: ["architecture", "data-flow", "state"],
    bad: {
      language: "tsx",
      code: "// Global store for state owned by one component\nconst modalStore = createStore({ isOpen: false });",
    },
    good: {
      language: "tsx",
      code: "const [isOpen, setIsOpen] = useState(false);",
    },
    detection: { autoFixable: false, detectable: false },
  },
  {
    id: "REACT-004",
    title: "Do not store derived state",
    summary:
      "If a value can be calculated from current props or state during render, derive it instead of synchronizing another state variable.",
    rationale:
      "Duplicated state creates synchronization paths and can briefly or permanently disagree with its source values.",
    level: "must",
    pack: "react",
    status: "stable",
    tags: ["data-flow", "react", "state"],
    bad: {
      language: "tsx",
      code: 'const [fullName, setFullName] = useState("");\nuseEffect(() => setFullName(`${first} ${last}`), [first, last]);',
    },
    good: {
      language: "tsx",
      code: "const fullName = `${first} ${last}`;",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "REACT-005",
    title: "Use effects to synchronize external systems",
    summary:
      "Do not reach for useEffect for synchronous derivation or event handling that can happen directly.",
    rationale:
      "Effects run after render and introduce a second execution phase. Keeping synchronous logic in render or event handlers reduces timing bugs.",
    level: "should",
    pack: "react",
    status: "stable",
    tags: ["effects", "react"],
    bad: {
      language: "tsx",
      code: "const [shouldSave, setShouldSave] = useState(false);\n\nuseEffect(() => {\n  if (shouldSave) saveForm(form);\n}, [form, shouldSave]);",
    },
    good: {
      language: "tsx",
      code: "const handleSave = () => {\n  saveForm(form);\n};",
    },
    references: [
      {
        label: "React — You Might Not Need an Effect",
        url: "https://react.dev/learn/you-might-not-need-an-effect",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "REACT-006",
    title: "Use stable list keys",
    summary:
      "Keys should identify the same logical item across inserts, deletes, sorting, and re-rendering.",
    rationale:
      "Unstable keys can preserve state on the wrong item or force unnecessary unmounts and remounts.",
    level: "must",
    pack: "react",
    status: "stable",
    tags: ["keys", "lists", "react"],
    bad: {
      language: "tsx",
      code: "items.map((item, index) => <Row key={index} item={item} />)",
    },
    good: {
      language: "tsx",
      code: "items.map((item) => <Row key={item.id} item={item} />)",
    },
    exceptions: [
      "An index key is acceptable for a truly static list whose ordering and membership can never change.",
    ],
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
    id: "REACT-007",
    title: "Keep render pure",
    summary:
      "Rendering should calculate UI from current inputs without mutating external state or causing observable side effects.",
    rationale:
      "React may render more than once, interrupt rendering, or discard work. Render-time side effects become unpredictable under those semantics.",
    level: "must",
    pack: "react",
    status: "stable",
    tags: ["purity", "react", "rendering"],
    bad: {
      language: "tsx",
      code: 'const UserCard = ({ user }) => {\n  analytics.track("UserCard rendered", { userId: user.id });\n  return <h2>{user.name}</h2>;\n};',
    },
    good: {
      language: "tsx",
      code: 'const UserCard = ({ user }) => {\n  useEffect(() => {\n    analytics.track("UserCard viewed", { userId: user.id });\n  }, [user.id]);\n\n  return <h2>{user.name}</h2>;\n};',
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "REACT-008",
    title: "Move static values out of components",
    summary:
      "Constants and configuration that never depend on props or state should live at module scope.",
    rationale:
      "Module-scope values communicate that they are invariant and avoid recreating objects or arrays on every render.",
    level: "prefer",
    pack: "react",
    status: "stable",
    tags: ["components", "performance", "react"],
    bad: {
      language: "tsx",
      code: 'const CountrySelect = () => {\n  const options = ["Canada", "France", "Japan"];\n  return <Select options={options} />;\n};',
    },
    good: {
      language: "tsx",
      code: 'const countryOptions = ["Canada", "France", "Japan"];\n\nconst CountrySelect = () => <Select options={countryOptions} />;',
    },
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
    id: "REACT-009",
    title: "Follow the Rules of Hooks",
    summary:
      "Call Hooks only at the top level of React components or custom Hooks, never inside loops, conditions, nested functions, or try/catch blocks.",
    rationale:
      "React relies on stable Hook call order to associate state and effects with the correct component instance.",
    level: "must",
    pack: "react",
    status: "stable",
    tags: ["hooks", "react", "safety"],
    bad: {
      language: "tsx",
      code: "const Counter = ({ isEnabled }) => {\n  if (isEnabled) {\n    const [count, setCount] = useState(0);\n    return <span>{count}</span>;\n  }\n\n  return null;\n};",
    },
    good: {
      language: "tsx",
      code: "const Counter = ({ isEnabled }) => {\n  const [count, setCount] = useState(0);\n\n  if (!isEnabled) return null;\n  return <span>{count}</span>;\n};",
    },
    references: [
      {
        label: "React — Rules of Hooks",
        url: "https://react.dev/reference/rules/rules-of-hooks",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "lint" },
  },
  {
    id: "REACT-010",
    title: "Let React call components",
    summary:
      "Render components through JSX instead of invoking component functions directly.",
    rationale:
      "React must control component invocation to preserve Hook behavior, reconciliation, and component identity.",
    level: "must",
    pack: "react",
    status: "stable",
    tags: ["components", "react", "rendering"],
    bad: {
      language: "tsx",
      code: "const UserCard = ({ user }) => <strong>{user.name}</strong>;\nconst content = UserCard({ user });",
    },
    good: {
      language: "tsx",
      code: "const content = <UserCard user={user} />;",
    },
    references: [
      {
        label: "React — Rules of React",
        url: "https://react.dev/reference/rules",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
    id: "REACT-011",
    title: "Treat props, state, and Hook inputs as immutable snapshots",
    summary:
      "Do not mutate values supplied by React or values already passed into Hooks or JSX.",
    rationale:
      "React assumes render inputs remain stable for the duration of a render so it can restart, reuse, and optimize work safely.",
    level: "must",
    pack: "react",
    status: "stable",
    tags: ["immutability", "props", "react", "state"],
    bad: {
      language: "tsx",
      code: "const UserName = ({ user }) => {\n  user.name = user.name.trim();\n  return <span>{user.name}</span>;\n};",
    },
    good: {
      language: "tsx",
      code: "const UserName = ({ user }) => {\n  const displayName = user.name.trim();\n  return <span>{displayName}</span>;\n};",
    },
    references: [
      {
        label: "React — Components and Hooks must be pure",
        url: "https://react.dev/reference/rules/components-and-hooks-must-be-pure",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "REACT-012",
    title: "Do not suppress Hook dependency correctness",
    summary:
      "Include the reactive values a Hook depends on instead of silencing exhaustive-dependency checks to preserve an intended stale closure.",
    rationale:
      "Missing dependencies make Effects and memoized callbacks observe outdated values and create timing-sensitive bugs.",
    level: "must",
    pack: "react",
    status: "stable",
    tags: ["dependencies", "effects", "hooks", "react"],
    bad: {
      language: "tsx",
      code: "const UserPanel = ({ userId }) => {\n  useEffect(() => {\n    loadUser(userId);\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);\n\n  return <section />;\n};",
    },
    good: {
      language: "tsx",
      code: "const UserPanel = ({ userId }) => {\n  useEffect(() => {\n    loadUser(userId);\n  }, [userId]);\n\n  return <section />;\n};",
    },
    references: [
      {
        label: "React — useMemo",
        url: "https://react.dev/reference/react/useMemo",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "lint" },
  },
  {
    id: "REACT-013",
    title: "Extract coherent React responsibilities, not arbitrary line counts",
    summary:
      "Split a component or custom Hook when it owns multiple independent responsibilities or becomes difficult to scan, not merely because it crossed a fixed LOC threshold.",
    rationale:
      "Small focused units are easier to test and understand, but mechanical file-size limits often create fragmentation without improving cohesion.",
    level: "should",
    pack: "react",
    status: "stable",
    tags: ["components", "hooks", "react", "separation-of-concerns"],
    bad: {
      language: "tsx",
      code: "const Dashboard = () => {\n  const billing = useBilling();\n  const notifications = useNotifications();\n  const search = useSearch();\n\n  return <DashboardView {...{ billing, notifications, search }} />;\n};",
    },
    good: {
      language: "tsx",
      code: "const Dashboard = () => (\n  <>\n    <BillingPanel />\n    <NotificationsPanel />\n    <SearchPanel />\n  </>\n);",
      note: "Split by coherent responsibility, not because a file crossed an arbitrary line count.",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
