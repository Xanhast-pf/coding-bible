import type { CodingRule } from "../../types";

export const ts006Rule = {
  id: "TS-006",
  title: "Model variants as discriminated unions",
  summary:
    "When states have different valid fields, model them as explicit variants instead of combinations of unrelated booleans and optional properties.",
  rationale:
    "Discriminated unions make invalid combinations unrepresentable and enable exhaustive handling.",
  level: "prefer",
  pack: "typescript",
  status: "stable",
  tags: ["modeling", "safety", "types"],
  bad: {
    language: "ts",
    code: "interface RequestState {\n  error?: Error;\n  isLoading: boolean;\n  data?: Data;\n}",
  },
  good: {
    language: "ts",
    code: 'type RequestState =\n  | { status: "loading" }\n  | { status: "error"; error: Error }\n  | { status: "success"; data: Data };',
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
