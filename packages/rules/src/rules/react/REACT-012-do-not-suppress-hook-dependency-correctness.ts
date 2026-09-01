import type { CodingRule } from "../../types";

export const react012Rule = {
  id: "REACT-012",
  title: "Do not suppress Hook dependency correctness",
  summary:
    "Include the reactive values a Hook depends on instead of silencing exhaustive-dependency checks to preserve an intended stale closure.",
  rationale:
    "Missing dependencies make Effects and memoized callbacks observe outdated values and create timing-sensitive bugs.",
  level: "must",
  pack: "react",
  status: "stable",
  tags: ["dependencies", "effects", "hooks", "react"],
  bad: {
    language: "tsx",
    code: "const UserPanel = ({ userId }) => {\n  useEffect(() => {\n    loadUser(userId);\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);\n\n  return <section />;\n};",
  },
  good: {
    language: "tsx",
    code: "const UserPanel = ({ userId }) => {\n  useEffect(() => {\n    loadUser(userId);\n  }, [userId]);\n\n  return <section />;\n};",
  },
  references: [
    {
      label: "React — useMemo",
      url: "https://react.dev/reference/react/useMemo",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "lint" },
} satisfies CodingRule;
