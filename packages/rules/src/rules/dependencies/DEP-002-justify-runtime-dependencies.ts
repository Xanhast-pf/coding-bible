import type { CodingRule } from "../../types";

export const dep002Rule = {
  id: "DEP-002",
  title: "Justify runtime dependencies",
  summary:
    "A runtime dependency should provide enough durable value to outweigh its bundle size, API surface, security surface, and upgrade cost.",
  rationale:
    "Convenient packages can become long-lived architectural commitments after their original use case disappears.",
  level: "must",
  pack: "dependencies",
  status: "stable",
  tags: ["dependencies", "maintenance", "runtime"],
  bad: {
    language: "ts",
    code: '// New runtime package for one trivial operation.\nimport isOdd from "is-odd";\n\nconst shouldAlternate = isOdd(index);',
  },
  good: {
    language: "ts",
    code: "const shouldAlternate = index % 2 !== 0;",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
