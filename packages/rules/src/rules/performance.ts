import type { CodingRule } from "../types";

export const performanceRules = [
  {
    id: "PERF-001",
    title: "Optimize where scale exists",
    summary:
      "Prefer readability by default; reduce passes and allocations when scale makes the cost meaningful.",
    rationale:
      "Premature micro-optimization obscures code, while repeated work over genuinely large datasets creates measurable cost.",
    level: "prefer",
    pack: "performance",
    status: "stable",
    tags: ["iteration", "performance"],
    bad: {
      language: "ts",
      code: "let settingsItem: MenuItem | undefined;\nfor (let index = 0; index < menuItems.length; index += 1) {\n  if (menuItems[index]?.id === \"settings\") {\n    settingsItem = menuItems[index];\n    break;\n  }\n}",
    },
    good: {
      language: "ts",
      code: "const settingsItem = menuItems.find(\n  (item) => item.id === \"settings\",\n);",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "PERF-002",
    title: "Measure before micro-optimizing",
    summary:
      "Use profiling, benchmarks, production telemetry, or a known complexity bound before sacrificing clarity for small performance gains.",
    rationale:
      "Without evidence, optimization effort often targets code that is not responsible for meaningful user-visible cost.",
    level: "should",
    pack: "performance",
    status: "stable",
    tags: ["measurement", "performance", "profiling"],
    bad: {
      language: "ts",
      code: "// \"This looks slow.\"\nconst cachedNormalizeUsers = memoize(normalizeUsers);",
    },
    good: {
      language: "ts",
      code: "performance.mark(\"normalize:start\");\nconst users = normalizeUsers(payload);\nperformance.mark(\"normalize:end\");\nperformance.measure(\n  \"normalizeUsers\",\n  \"normalize:start\",\n  \"normalize:end\",\n);",
    },
    detection: { autoFixable: false, detectable: false },
  },
  {
    id: "PERF-003",
    title: "Prefer one pass on hot large-data paths",
    summary:
      "When processing large collections in a hot path, avoid chains that create avoidable intermediate arrays when one clear pass can do the work.",
    rationale:
      "Repeated passes and intermediate allocations scale with dataset size and can become significant in data-heavy applications.",
    level: "prefer",
    pack: "performance",
    status: "stable",
    tags: ["collections", "iteration", "performance"],
    bad: {
      language: "ts",
      code: "const total = rows\n  .filter(isBillable)\n  .map(getAmount)\n  .reduce((sum, amount) => sum + amount, 0);",
    },
    good: {
      language: "ts",
      code: "let total = 0;\nfor (const row of rows) {\n  if (isBillable(row)) {\n    total += getAmount(row);\n  }\n}",
    },
    exceptions: [
      "For small collections or non-hot paths, a readable map/filter chain may be the better engineering choice.",
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
  },
] satisfies readonly CodingRule[];
