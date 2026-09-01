import type { CodingRule } from "../../types";

export const redux008Rule = {
  id: "REDUX-008",
  title: "Keep transient UI and form state local by default",
  summary:
    "Do not put temporary form edits, hover state, or component-local interaction state in Redux without a genuine cross-application ownership need.",
  rationale:
    "Local state keeps ownership close to the UI and avoids dispatching global actions for data that is neither shared nor cached.",
  level: "prefer",
  pack: "redux",
  status: "stable",
  tags: ["forms", "redux", "state"],
  bad: {
    language: "tsx",
    code: "<input\n  value={name}\n  onChange={(event) => dispatch(nameChanged(event.target.value))}\n/>",
  },
  good: {
    language: "tsx",
    code: 'const [name, setName] = useState("");\n\n<input value={name} onChange={(event) => setName(event.target.value)} />',
  },
  references: [
    {
      label: "Redux — Style Guide",
      url: "https://redux.js.org/style-guide/",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
