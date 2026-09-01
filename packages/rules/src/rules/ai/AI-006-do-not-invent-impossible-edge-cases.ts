import type { CodingRule } from "../../types";

export const ai006Rule = {
  id: "AI-006",
  title: "Do not invent impossible edge cases",
  summary:
    "Generated defensive code and tests should reflect actual contracts, trust boundaries, and realistic failure modes.",
  rationale:
    "Speculative edge cases bloat types, branches, and tests while obscuring the conditions the system genuinely needs to handle.",
  level: "should",
  pack: "ai",
  status: "stable",
  tags: ["ai", "defensive-code", "testing"],
  bad: {
    language: "ts",
    code: 'function getUserName(user: User) {\n  if (!user || Array.isArray(user) || typeof user.name !== "string") {\n    return "Unknown";\n  }\n\n  return user.name;\n}',
  },
  good: {
    language: "ts",
    code: "function getUserName(user: User) {\n  return user.name;\n}\n\n// Validate unknown input once at the system boundary.",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
