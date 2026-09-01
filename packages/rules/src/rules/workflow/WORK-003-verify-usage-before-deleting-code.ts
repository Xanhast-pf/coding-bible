import type { CodingRule } from "../../types";

export const work003Rule = {
  id: "WORK-003",
  title: "Verify usage before deleting code",
  summary:
    "Search static, dynamic, generated, and runtime entry points before concluding that code is unused.",
  rationale:
    "Dead-code tools have blind spots around dynamic imports, reflection, configuration, and generated wiring; deleting live code is worse than temporarily keeping dead code.",
  level: "must",
  pack: "workflow",
  status: "stable",
  tags: ["dead-code", "refactoring", "workflow"],
  bad: {
    language: "bash",
    code: "rm src/legacyParser.ts",
  },
  good: {
    language: "bash",
    code: 'rg "legacyParser|parseLegacy" src tests config\n# Inspect dynamic imports and generated/config wiring too.\nrm src/legacyParser.ts',
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
