import type { CodingRule } from "../../types";

export const react002Rule = {
  id: "REACT-002",
  title: "Do not memoize by reflex",
  summary:
    "Use memoization when identity matters or profiling demonstrates a meaningful benefit.",
  rationale:
    "Unnecessary memoization adds dependency management and cognitive overhead without guaranteed benefit.",
  level: "prefer",
  pack: "react",
  status: "stable",
  tags: ["performance", "react"],
  bad: {
    language: "tsx",
    code: "const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);",
  },
  good: {
    language: "tsx",
    code: "const fullName = `${firstName} ${lastName}`;",
  },
  references: [
    {
      label: "React — useMemo",
      url: "https://react.dev/reference/react/useMemo",
    },
    {
      label: "React — React Compiler",
      url: "https://react.dev/learn/react-compiler",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
