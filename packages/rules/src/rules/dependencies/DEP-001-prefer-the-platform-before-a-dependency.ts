import type { CodingRule } from "../../types";

export const dep001Rule = {
  id: "DEP-001",
  title: "Prefer the platform before a dependency",
  summary:
    "Check whether the language, runtime, browser, or existing stack already solves the problem before adding a package.",
  rationale:
    "Every dependency adds bundle, security, upgrade, compatibility, and maintenance cost that native capabilities do not.",
  level: "should",
  pack: "dependencies",
  status: "stable",
  tags: ["dependencies", "platform"],
  bad: {
    language: "ts",
    code: 'import uniq from "lodash/uniq";\n\nconst uniqueIds = uniq(ids);',
  },
  good: {
    language: "ts",
    code: "const uniqueIds = [...new Set(ids)];",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
