import type { CodingRule } from "../../types";

export const legend004Rule = {
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
} satisfies CodingRule;
