import type { CodingRule } from "../types";

export const performanceRules = [
  {
    id: "PERF-001",
    title: "Optimize where scale exists",
    summary: "Prefer readability by default; reduce passes and allocations when scale makes the cost meaningful.",
    rationale:
      "Premature micro-optimization obscures code, while repeated work over genuinely large datasets creates measurable cost.",
    level: "prefer",
    pack: "performance",
    status: "stable",
    tags: ["iteration", "performance"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
