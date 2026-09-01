import type { CodingRule } from "../../types";

export const ts005Rule = {
  id: "TS-005",
  title: "Optional means genuinely optional",
  summary:
    "Do not mark properties optional merely to satisfy existing call sites or silence type errors.",
  rationale:
    "Unnecessary optionality pushes null checks to every consumer and permits states the runtime contract may never produce.",
  level: "must",
  pack: "typescript",
  status: "stable",
  tags: ["optionality", "safety", "types"],
  bad: {
    language: "ts",
    code: "interface User {\n  id?: string;\n  email?: string;\n}",
  },
  good: {
    language: "ts",
    code: "interface User {\n  id: string;\n  email: string;\n}",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
