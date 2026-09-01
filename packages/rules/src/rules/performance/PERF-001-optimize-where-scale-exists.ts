import type { CodingRule } from "../../types";

export const perf001Rule = {
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
    code: 'let settingsItem: MenuItem | undefined;\nfor (let index = 0; index < menuItems.length; index += 1) {\n  if (menuItems[index]?.id === "settings") {\n    settingsItem = menuItems[index];\n    break;\n  }\n}',
  },
  good: {
    language: "ts",
    code: 'const settingsItem = menuItems.find(\n  (item) => item.id === "settings",\n);',
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
