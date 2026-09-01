import type { CodingRule } from "../../types";

export const react007Rule = {
  id: "REACT-007",
  title: "Keep render pure",
  summary:
    "Rendering should calculate UI from current inputs without mutating external state or causing observable side effects.",
  rationale:
    "React may render more than once, interrupt rendering, or discard work. Render-time side effects become unpredictable under those semantics.",
  level: "must",
  pack: "react",
  status: "stable",
  tags: ["purity", "react", "rendering"],
  bad: {
    language: "tsx",
    code: 'const UserCard = ({ user }) => {\n  analytics.track("UserCard rendered", { userId: user.id });\n  return <h2>{user.name}</h2>;\n};',
  },
  good: {
    language: "tsx",
    code: 'const UserCard = ({ user }) => {\n  useEffect(() => {\n    analytics.track("UserCard viewed", { userId: user.id });\n  }, [user.id]);\n\n  return <h2>{user.name}</h2>;\n};',
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
