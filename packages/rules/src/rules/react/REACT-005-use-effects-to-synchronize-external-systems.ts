import type { CodingRule } from "../../types";

export const react005Rule = {
  id: "REACT-005",
  title: "Use effects to synchronize external systems",
  summary:
    "Do not reach for useEffect for synchronous derivation or event handling that can happen directly.",
  rationale:
    "Effects run after render and introduce a second execution phase. Keeping synchronous logic in render or event handlers reduces timing bugs.",
  level: "should",
  pack: "react",
  status: "stable",
  tags: ["effects", "react"],
  bad: {
    language: "tsx",
    code: "const [shouldSave, setShouldSave] = useState(false);\n\nuseEffect(() => {\n  if (shouldSave) saveForm(form);\n}, [form, shouldSave]);",
  },
  good: {
    language: "tsx",
    code: "const handleSave = () => {\n  saveForm(form);\n};",
  },
  references: [
    {
      label: "React — You Might Not Need an Effect",
      url: "https://react.dev/learn/you-might-not-need-an-effect",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
