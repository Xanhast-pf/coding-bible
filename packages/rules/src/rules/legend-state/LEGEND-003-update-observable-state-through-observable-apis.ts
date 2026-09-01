import type { CodingRule } from "../../types";

export const legend003Rule = {
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
} satisfies CodingRule;
