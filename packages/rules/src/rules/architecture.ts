import type { CodingRule } from "../types";

export const architectureRules = [
  {
    id: "ARCH-001",
    title: "Separate responsibilities",
    summary:
      "Rendering, orchestration, transformation, persistence, and external I/O should have explicit ownership.",
    rationale:
      "Separating responsibilities makes code easier to reason about, test, replace, and review without requiring knowledge of unrelated behavior.",
    level: "must",
    pack: "architecture",
    status: "stable",
    tags: ["architecture", "separation-of-concerns"],
    bad: {
      language: "ts",
      code: 'export const loadOrders = async () => {\n  const response = await fetch("/api/orders");\n  const orders = await response.json();\n  localStorage.setItem("orders", JSON.stringify(orders));\n  document.querySelector("#total")!.textContent = summarizeOrders(orders);\n};',
    },
    good: {
      language: "ts",
      code: "const orders = await orderApi.list();\nconst summary = summarizeOrders(orders);\n\norderCache.save(orders);\nrenderOrderSummary(summary);",
    },
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
    id: "ARCH-002",
    title: "Keep dependencies explicit",
    summary:
      "A module should receive or import the dependencies it actually uses rather than reaching through unrelated layers.",
    rationale:
      "Explicit dependencies expose coupling and make ownership, testing, and replacement easier to understand.",
    level: "should",
    pack: "architecture",
    status: "stable",
    tags: ["architecture", "dependencies"],
    bad: {
      language: "ts",
      code: 'export const completeCheckout = (order: Order) => {\n  app.services.analytics.track("checkout_completed", order.id);\n};',
    },
    good: {
      language: "ts",
      code: 'export const completeCheckout = (\n  order: Order,\n  analytics: Analytics,\n) => {\n  analytics.track("checkout_completed", order.id);\n};',
    },
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
    id: "ARCH-003",
    title: "Abstract after understanding repetition",
    summary:
      "Do not create a shared abstraction until the repeated behavior and its stable differences are understood.",
    rationale:
      "Small duplication is cheaper than a premature abstraction that couples unrelated use cases and becomes difficult to change.",
    level: "prefer",
    pack: "architecture",
    status: "stable",
    tags: ["abstraction", "architecture", "dry"],
    bad: {
      language: "ts",
      code: 'saveEntity("article", article, { draft: true, audit: false });\nsaveEntity("invoice", invoice, { draft: false, audit: true });',
    },
    good: {
      language: "ts",
      code: "saveArticleDraft(article);\nissueInvoice(invoice);\n\n// Extract shared behavior only after the common contract is clear.",
    },
    detection: {
      autoFixable: false,
      detectable: false,
    },
  },
  {
    id: "ARCH-004",
    title: "Keep side effects at boundaries",
    summary:
      "Prefer pure transformation logic internally and isolate network, storage, clock, DOM, and other side effects behind clear boundaries.",
    rationale:
      "Isolated side effects make behavior easier to test, replay, reason about, and replace.",
    level: "should",
    pack: "architecture",
    status: "stable",
    tags: ["architecture", "side-effects", "testability"],
    bad: {
      language: "ts",
      code: 'export const calculateCartTotal = () => {\n  const cart = JSON.parse(localStorage.getItem("cart") ?? "[]");\n  return cart.reduce((sum, item) => sum + item.price, 0);\n};',
    },
    good: {
      language: "ts",
      code: "export const calculateCartTotal = (cart: CartItem[]) =>\n  cart.reduce((sum, item) => sum + item.price, 0);\n\nconst cart = cartStorage.load();\nconst total = calculateCartTotal(cart);",
    },
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
    id: "ARCH-005",
    title: "Keep one source of truth",
    summary:
      "Do not maintain multiple independently writable representations of the same fact.",
    rationale:
      "Duplicated state can drift. A canonical owner with derived views removes synchronization bugs and clarifies responsibility.",
    level: "must",
    pack: "architecture",
    status: "stable",
    tags: ["architecture", "data-flow", "state"],
    bad: {
      language: "tsx",
      code: "const [items, setItems] = useState<Item[]>([]);\nconst [itemCount, setItemCount] = useState(0);\n\n// Both must now stay synchronized.",
    },
    good: {
      language: "tsx",
      code: "const [items, setItems] = useState<Item[]>([]);\nconst itemCount = items.length;",
    },
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
    id: "ARCH-006",
    title: "Do not add pass-through abstractions",
    summary:
      "An abstraction should add meaning, policy, transformation, or a stable boundary rather than merely forward every call unchanged.",
    rationale:
      "Pass-through layers add files and indirection without reducing coupling or complexity.",
    level: "prefer",
    pack: "architecture",
    status: "stable",
    tags: ["abstraction", "architecture", "indirection"],
    bad: {
      language: "ts",
      code: 'class HttpClient {\n  get(url: string) {\n    return fetch(url);\n  }\n}\n\nawait httpClient.get("/api/users");',
    },
    good: {
      language: "ts",
      code: 'await fetch("/api/users");',
    },
    exceptions: [
      "A deliberate compatibility boundary or public facade may justify forwarding when it protects consumers from an unstable implementation.",
    ],
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
    id: "ARCH-007",
    title: "Organize around cohesive domains",
    summary:
      "Prefer module boundaries that reflect product or business concepts over generic buckets that accumulate unrelated code.",
    rationale:
      "Domain-oriented structure keeps behavior that changes together physically close and makes ownership easier to discover.",
    level: "should",
    pack: "architecture",
    status: "stable",
    tags: ["architecture", "cohesion", "structure"],
    bad: {
      language: "text",
      code: "src/\n  components/\n    OrderList.tsx\n    UserAvatar.tsx\n  hooks/\n    useOrders.ts\n    useProfile.ts\n  services/\n    orders.ts\n    profile.ts",
    },
    good: {
      language: "text",
      code: "src/\n  orders/\n    OrderList.tsx\n    useOrders.ts\n    orderApi.ts\n  profile/\n    UserAvatar.tsx\n    useProfile.ts\n    profileApi.ts",
    },
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
] satisfies readonly CodingRule[];
