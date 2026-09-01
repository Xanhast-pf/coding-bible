import type { CodingRule } from "../../types";

export const arch007Rule = {
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
} satisfies CodingRule;
