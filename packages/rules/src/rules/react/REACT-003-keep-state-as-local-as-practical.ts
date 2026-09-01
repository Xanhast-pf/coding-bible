import type { CodingRule } from "../../types";

export const react003Rule = {
  id: "REACT-003",
  title: "Keep state as local as practical",
  summary:
    "Use explicit props and local state until multiple consumers genuinely require shared ownership.",
  rationale:
    "Global state hides dependencies. Local state and explicit data flow make ownership easier to understand.",
  level: "prefer",
  pack: "react",
  status: "stable",
  tags: ["architecture", "data-flow", "state"],
  bad: {
    language: "tsx",
    code: "// Global store for state owned by one component\nconst modalStore = createStore({ isOpen: false });",
  },
  good: {
    language: "tsx",
    code: "const [isOpen, setIsOpen] = useState(false);",
  },
  detection: { autoFixable: false, detectable: false },
} satisfies CodingRule;
