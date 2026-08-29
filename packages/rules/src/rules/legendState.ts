import type { CodingRule } from "../types";

export const legendStateRules = [
  {
    id: "LEGEND-001",
    title: "Use useValue for React subscriptions",
    summary:
      "In new React code, read observables reactively through useValue instead of relying on observer plus get() tracking.",
    rationale:
      "Legend-State v3 recommends useValue for React Compiler compatibility because Hook calls remain visible to the compiler while arbitrary get() calls may be memoized.",
    level: "must",
    pack: "legend-state",
    status: "stable",
    tags: ["legend-state", "react", "react-compiler", "subscriptions"],
    bad: {
      language: "tsx",
      code: "const Component = observer(() => <div>{store$.name.get()}</div>);",
    },
    good: {
      language: "tsx",
      code: "const Component = () => {\n  const name = useValue(store$.name);\n  return <div>{name}</div>;\n};",
    },
    references: [
      {
        label: "Legend-State v3 — Migrating",
        url: "https://legendapp.com/open-source/state/v3/other/migrating/",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
    id: "LEGEND-002",
    title: "Use peek only when non-reactive access is intentional",
    summary:
      "Use get() in tracking contexts when changes should be observed and peek() when the read deliberately must not subscribe.",
    rationale:
      "get() participates in Legend-State dependency tracking while peek() explicitly opts out, so the choice communicates reactivity intent.",
    level: "must",
    pack: "legend-state",
    status: "stable",
    tags: ["legend-state", "peek", "reactivity", "tracking"],
    bad: {
      language: "ts",
      code: 'const userId = session$.userId.get();\nanalytics.track("checkout", { userId });',
    },
    good: {
      language: "ts",
      code: 'const userId = session$.userId.peek();\nanalytics.track("checkout", { userId });',
      note: "peek() makes the intentional non-reactive read explicit.",
    },
    references: [
      {
        label: "Legend-State v3 — Observable",
        url: "https://legendapp.com/open-source/state/v3/usage/observable/",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "LEGEND-003",
    title: "Update observable state through observable APIs",
    summary:
      "Do not mutate raw objects returned from an observable and then set the same reference back; update the observable node with set, assign, or another notifying API.",
    rationale:
      "Mutating raw data bypasses Legend-State notifications, and setting the same reference back may produce no observable change.",
    level: "must",
    pack: "legend-state",
    status: "stable",
    tags: ["legend-state", "mutation", "reactivity"],
    bad: {
      language: "ts",
      code: 'const profile = store$.profile.peek();\nprofile.name = "Ada";\nstore$.profile.set(profile);',
    },
    good: {
      language: "ts",
      code: 'store$.profile.name.set("Ada");',
    },
    references: [
      {
        label: "Legend-State v3 — Observable",
        url: "https://legendapp.com/open-source/state/v3/usage/observable/",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "LEGEND-004",
    title: "Batch sibling updates with assign",
    summary:
      "When several sibling fields change as one logical operation, prefer assign over a sequence of independent set calls.",
    rationale:
      "assign batches its individual writes so observers update once and the operation is represented as one coherent state transition.",
    level: "should",
    pack: "legend-state",
    status: "stable",
    tags: ["batching", "legend-state", "performance", "updates"],
    bad: {
      language: "ts",
      code: "store$.data.set(response.data);\nstore$.isLoading.set(false);",
    },
    good: {
      language: "ts",
      code: "store$.assign({\n  data: response.data,\n  isLoading: false,\n});",
    },
    references: [
      {
        label: "Legend-State v3 — Observable",
        url: "https://legendapp.com/open-source/state/v3/usage/observable/",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "LEGEND-005",
    title: "Subscribe at the narrowest useful observable",
    summary:
      "Prefer fine-grained subscriptions or computed useValue selectors over reading broad trees when only a small value drives rendering.",
    rationale:
      "Legend-State's performance model depends on minimizing tracked observables so unrelated changes do not rerender parent components.",
    level: "should",
    pack: "legend-state",
    status: "stable",
    tags: ["legend-state", "performance", "subscriptions"],
    bad: {
      language: "tsx",
      code: "const state = useValue(store$);\nreturn <Badge>{state.notifications.unread}</Badge>;",
    },
    good: {
      language: "tsx",
      code: "const unread = useValue(store$.notifications.unread);\nreturn <Badge>{unread}</Badge>;",
    },
    references: [
      {
        label: "Legend-State v3 — Performance",
        url: "https://legendapp.com/open-source/state/v3/guides/performance/",
      },
      {
        label: "Legend-State v3 — Tracing",
        url: "https://legendapp.com/open-source/state/v3/react/tracing/",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "LEGEND-006",
    title: "Keep persisted or synchronized state serializable",
    summary:
      "When observable data crosses persistence, transport, devtool, or application-specific serialization boundaries, keep that state plain and serializable.",
    rationale:
      "Legend-State itself can hold functions and rich values, but serialization layers cannot reliably preserve arbitrary runtime objects or circular references.",
    level: "must",
    pack: "legend-state",
    status: "stable",
    tags: ["legend-state", "persistence", "serialization", "sync"],
    bad: {
      language: "ts",
      code: "store$.session.set({\n  lastSeen: new Date(),\n  onClose: closeSession,\n});",
    },
    good: {
      language: "ts",
      code: "store$.session.set({\n  lastSeenIso: new Date().toISOString(),\n});",
      note: "Use plain values for observable nodes that are persisted, synchronized, or transported.",
    },
    exceptions: [
      "Purely in-memory observables that never cross a serialization boundary may intentionally contain functions or other supported runtime values.",
    ],
    references: [
      {
        label: "Legend-State v3 — Observable",
        url: "https://legendapp.com/open-source/state/v3/usage/observable/",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
