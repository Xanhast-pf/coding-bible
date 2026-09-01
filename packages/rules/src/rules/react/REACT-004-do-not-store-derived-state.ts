import type { CodingRule } from "../../types";

export const react004Rule = {
  id: "REACT-004",
  title: "Do not store derived state",
  summary:
    "If a value can be calculated from current props or state during render, derive it instead of synchronizing another state variable.",
  rationale:
    "Duplicated state creates synchronization paths and can briefly or permanently disagree with its source values.",
  level: "must",
  pack: "react",
  status: "stable",
  tags: ["data-flow", "react", "state"],
  bad: {
    language: "tsx",
    code: 'const [fullName, setFullName] = useState("");\nuseEffect(() => setFullName(`${first} ${last}`), [first, last]);',
  },
  good: {
    language: "tsx",
    code: "const fullName = `${first} ${last}`;",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
