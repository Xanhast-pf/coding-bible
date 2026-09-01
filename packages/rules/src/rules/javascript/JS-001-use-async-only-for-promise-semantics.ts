import type { CodingRule } from "../../types";

export const js001Rule = {
  id: "JS-001",
  title: "Use async only for Promise semantics",
  summary:
    "Do not mark a function async unless it awaits work or intentionally exposes a Promise-returning contract.",
  rationale:
    "async changes the function's return contract and error behavior. Adding it without Promise semantics misleads callers and readers.",
  level: "must",
  pack: "javascript",
  status: "stable",
  tags: ["async", "functions", "promises"],
  bad: {
    language: "ts",
    code: 'async function getStatusLabel() {\n  return "Ready";\n}',
  },
  good: {
    language: "ts",
    code: 'function getStatusLabel() {\n  return "Ready";\n}',
  },
  detection: { autoFixable: true, detectable: true, strategy: "ast" },
} satisfies CodingRule;
