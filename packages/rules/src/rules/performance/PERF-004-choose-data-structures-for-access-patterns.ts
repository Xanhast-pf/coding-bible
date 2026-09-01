import type { CodingRule } from "../../types";

export const perf004Rule = {
  id: "PERF-004",
  title: "Choose data structures for access patterns",
  summary:
    "Use arrays, sets, maps, indexes, or other structures according to how the data is actually queried and updated.",
  rationale:
    "An appropriate data structure can remove repeated linear scans and communicate the intended operations directly.",
  level: "should",
  pack: "performance",
  status: "stable",
  tags: ["algorithms", "data-structures", "performance"],
  bad: {
    language: "ts",
    code: "const rows = orders.map((order) => ({\n  order,\n  user: users.find((user) => user.id === order.userId),\n}));",
  },
  good: {
    language: "ts",
    code: "const usersById = new Map(users.map((user) => [user.id, user]));\n\nconst rows = orders.map((order) => ({\n  order,\n  user: usersById.get(order.userId),\n}));",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
