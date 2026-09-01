import type { CodingRule } from "../../types";

export const react008Rule = {
  id: "REACT-008",
  title: "Move static values out of components",
  summary:
    "Constants and configuration that never depend on props or state should live at module scope.",
  rationale:
    "Module-scope values communicate that they are invariant and avoid recreating objects or arrays on every render.",
  level: "prefer",
  pack: "react",
  status: "stable",
  tags: ["components", "performance", "react"],
  bad: {
    language: "tsx",
    code: 'const CountrySelect = () => {\n  const options = ["Canada", "France", "Japan"];\n  return <Select options={options} />;\n};',
  },
  good: {
    language: "tsx",
    code: 'const countryOptions = ["Canada", "France", "Japan"];\n\nconst CountrySelect = () => <Select options={countryOptions} />;',
  },
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
