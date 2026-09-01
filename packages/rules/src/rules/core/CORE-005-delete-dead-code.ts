import type { CodingRule } from "../../types";

export const core005Rule = {
  id: "CORE-005",
  title: "Delete dead code",
  summary:
    "Remove unused functions, imports, exports, files, branches, and dependencies when their last real use disappears.",
  rationale:
    "Dead code expands the surface maintainers must understand, obscures what is still supported, and creates false confidence that obsolete paths are tested.",
  level: "must",
  pack: "core",
  status: "stable",
  tags: ["cleanup", "dead-code", "maintainability"],
  bad: {
    language: "ts",
    code: "const calculateLegacyTax = (total: number) => total * 0.07;\n\nexport const calculateTax = (total: number) =>\n  taxService.calculate(total);",
  },
  good: {
    language: "ts",
    code: "export const calculateTax = (total: number) =>\n  taxService.calculate(total);",
  },
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
