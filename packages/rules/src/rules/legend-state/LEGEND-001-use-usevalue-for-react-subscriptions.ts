import type { CodingRule } from "../../types";

export const legend001Rule = {
  id: "LEGEND-001",
  title: "Use useValue for React subscriptions",
  summary:
    "In new React code, read observables reactively through useValue instead of relying on observer plus get() tracking.",
  rationale:
    "Legend-State v3 recommends useValue for React Compiler compatibility because Hook calls remain visible to the compiler while arbitrary get() calls may be memoized.",
  level: "must",
  pack: "legend-state",
  status: "stable",
  tags: ["legend-state", "react", "react-compiler", "subscriptions"],
  bad: {
    language: "tsx",
    code: "const Component = observer(() => <div>{store$.name.get()}</div>);",
  },
  good: {
    language: "tsx",
    code: "const Component = () => {\n  const name = useValue(store$.name);\n  return <div>{name}</div>;\n};",
  },
  references: [
    {
      label: "Legend-State v3 — Migrating",
      url: "https://legendapp.com/open-source/state/v3/other/migrating/",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
