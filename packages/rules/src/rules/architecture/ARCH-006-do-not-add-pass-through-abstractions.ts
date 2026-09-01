import type { CodingRule } from "../../types";

export const arch006Rule = {
  id: "ARCH-006",
  title: "Do not add pass-through abstractions",
  summary:
    "An abstraction should add meaning, policy, transformation, or a stable boundary rather than merely forward every call unchanged.",
  rationale:
    "Pass-through layers add files and indirection without reducing coupling or complexity.",
  level: "prefer",
  pack: "architecture",
  status: "stable",
  tags: ["abstraction", "architecture", "indirection"],
  bad: {
    language: "ts",
    code: 'class HttpClient {\n  get(url: string) {\n    return fetch(url);\n  }\n}\n\nawait httpClient.get("/api/users");',
  },
  good: {
    language: "ts",
    code: 'await fetch("/api/users");',
  },
  exceptions: [
    "A deliberate compatibility boundary or public facade may justify forwarding when it protects consumers from an unstable implementation.",
  ],
  detection: {
    autoFixable: false,
    detectable: true,
    strategy: "semantic",
  },
} satisfies CodingRule;
