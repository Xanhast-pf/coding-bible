import type { CodingRule } from "../../types";

export const react009Rule = {
  id: "REACT-009",
  title: "Follow the Rules of Hooks",
  summary:
    "Call Hooks only at the top level of React components or custom Hooks, never inside loops, conditions, nested functions, or try/catch blocks.",
  rationale:
    "React relies on stable Hook call order to associate state and effects with the correct component instance.",
  level: "must",
  pack: "react",
  status: "stable",
  tags: ["hooks", "react", "safety"],
  bad: {
    language: "tsx",
    code: "const Counter = ({ isEnabled }) => {\n  if (isEnabled) {\n    const [count, setCount] = useState(0);\n    return <span>{count}</span>;\n  }\n\n  return null;\n};",
  },
  good: {
    language: "tsx",
    code: "const Counter = ({ isEnabled }) => {\n  const [count, setCount] = useState(0);\n\n  if (!isEnabled) return null;\n  return <span>{count}</span>;\n};",
  },
  references: [
    {
      label: "React — Rules of Hooks",
      url: "https://react.dev/reference/rules/rules-of-hooks",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "lint" },
} satisfies CodingRule;
