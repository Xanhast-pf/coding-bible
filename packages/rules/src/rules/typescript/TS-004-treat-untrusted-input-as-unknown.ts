import type { CodingRule } from "../../types";

export const ts004Rule = {
  id: "TS-004",
  title: "Treat untrusted input as unknown",
  summary:
    "Parse and validate external data at a boundary before treating it as an internal domain type.",
  rationale:
    "TypeScript types do not validate network responses, storage values, URL parameters, or other runtime input.",
  level: "must",
  pack: "typescript",
  status: "stable",
  tags: ["boundaries", "safety", "types", "validation"],
  bad: {
    language: "ts",
    code: "const user = response.json() as User;",
  },
  good: {
    language: "ts",
    code: "const payload: unknown = await response.json();\nconst user = parseUser(payload);",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
