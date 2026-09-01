import type { CodingRule } from "../../types";

export const legend005Rule = {
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
} satisfies CodingRule;
