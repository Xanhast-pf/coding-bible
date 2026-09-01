import type { CodingRule } from "../../types";

export const flag001Rule = {
  id: "FLAG-001",
  title: "Every feature flag needs a removal plan",
  summary:
    "Create flags with an owner and a planned condition or date for removal.",
  rationale:
    "Flags are temporary branches in production code. Without an explicit end condition they become permanent complexity.",
  level: "must",
  pack: "feature-flags",
  status: "stable",
  tags: ["feature-flags", "maintenance"],
  bad: {
    language: "ts",
    code: "export const flags = {\n  newCheckout: false,\n};",
  },
  good: {
    language: "ts",
    code: 'export const flags = {\n  newCheckout: {\n    defaultValue: false,\n    owner: "checkout",\n    removalCondition: "100% rollout is stable for 7 days",\n  },\n};',
  },
  detection: { autoFixable: false, detectable: false },
} satisfies CodingRule;
