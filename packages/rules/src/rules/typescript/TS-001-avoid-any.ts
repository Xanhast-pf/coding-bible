import type { CodingRule } from "../../types";

export const ts001Rule = {
  id: "TS-001",
  title: "Avoid any",
  summary:
    "Use the narrowest correct type instead of opting out of type safety.",
  rationale:
    "any removes compiler guarantees at the boundary where they are most valuable and lets invalid states spread.",
  level: "must",
  pack: "typescript",
  status: "stable",
  tags: ["safety", "types"],
  bad: {
    language: "ts",
    code: "const buildParams = (params: any) => params;",
  },
  good: {
    language: "ts",
    code: "interface QueryParams {\n  page: number;\n  sortBy: string;\n}\n\nconst buildParams = (params: QueryParams) => params;",
  },
  exceptions: [
    "A tightly scoped third-party interoperability boundary may require a documented exception.",
  ],
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
