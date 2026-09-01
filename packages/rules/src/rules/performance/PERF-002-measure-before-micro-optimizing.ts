import type { CodingRule } from "../../types";

export const perf002Rule = {
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
    code: '// "This looks slow."\nconst cachedNormalizeUsers = memoize(normalizeUsers);',
  },
  good: {
    language: "ts",
    code: 'performance.mark("normalize:start");\nconst users = normalizeUsers(payload);\nperformance.mark("normalize:end");\nperformance.measure(\n  "normalizeUsers",\n  "normalize:start",\n  "normalize:end",\n);',
  },
  detection: { autoFixable: false, detectable: false },
} satisfies CodingRule;
