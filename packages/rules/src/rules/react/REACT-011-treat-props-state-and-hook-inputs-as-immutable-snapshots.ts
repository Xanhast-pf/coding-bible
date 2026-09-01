import type { CodingRule } from "../../types";

export const react011Rule = {
  id: "REACT-011",
  title: "Treat props, state, and Hook inputs as immutable snapshots",
  summary:
    "Do not mutate values supplied by React or values already passed into Hooks or JSX.",
  rationale:
    "React assumes render inputs remain stable for the duration of a render so it can restart, reuse, and optimize work safely.",
  level: "must",
  pack: "react",
  status: "stable",
  tags: ["immutability", "props", "react", "state"],
  bad: {
    language: "tsx",
    code: "const UserName = ({ user }) => {\n  user.name = user.name.trim();\n  return <span>{user.name}</span>;\n};",
  },
  good: {
    language: "tsx",
    code: "const UserName = ({ user }) => {\n  const displayName = user.name.trim();\n  return <span>{displayName}</span>;\n};",
  },
  references: [
    {
      label: "React — Components and Hooks must be pure",
      url: "https://react.dev/reference/rules/components-and-hooks-must-be-pure",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
