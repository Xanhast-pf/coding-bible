import type { CodingRule } from "../../types";

export const react010Rule = {
  id: "REACT-010",
  title: "Let React call components",
  summary:
    "Render components through JSX instead of invoking component functions directly.",
  rationale:
    "React must control component invocation to preserve Hook behavior, reconciliation, and component identity.",
  level: "must",
  pack: "react",
  status: "stable",
  tags: ["components", "react", "rendering"],
  bad: {
    language: "tsx",
    code: "const UserCard = ({ user }) => <strong>{user.name}</strong>;\nconst content = UserCard({ user });",
  },
  good: {
    language: "tsx",
    code: "const content = <UserCard user={user} />;",
  },
  references: [
    {
      label: "React — Rules of React",
      url: "https://react.dev/reference/rules",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
