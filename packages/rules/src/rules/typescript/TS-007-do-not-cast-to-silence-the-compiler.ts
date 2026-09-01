import type { CodingRule } from "../../types";

export const ts007Rule = {
  id: "TS-007",
  title: "Do not cast to silence the compiler",
  summary:
    "Use narrowing, validation, or a more accurate type instead of asserting a value into the shape you wish it had.",
  rationale:
    "Unchecked assertions can hide a real mismatch between the runtime contract and the type model.",
  level: "must",
  pack: "typescript",
  status: "stable",
  tags: ["assertions", "safety", "types"],
  bad: {
    language: "ts",
    code: "const payload: unknown = readPayload();\nconst user = payload as User;\nrenderUser(user);",
  },
  good: {
    language: "ts",
    code: 'if (!isUser(payload)) {\n  throw new Error("Invalid user payload");\n}\n\nrenderUser(payload);',
  },
  exceptions: [
    "A narrow assertion is acceptable when runtime invariants are stronger than TypeScript can express and that invariant is documented or proven locally.",
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
