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
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
