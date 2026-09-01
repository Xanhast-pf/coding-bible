import type { CodingRule } from "../../types";

export const legend002Rule = {
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
} satisfies CodingRule;
