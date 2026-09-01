import type { CodingRule } from "../../types";

export const ai001Rule = {
  id: "AI-001",
  title: "Generated code follows existing architecture",
  summary:
    "AI output should use established project patterns before introducing new abstractions.",
  rationale:
    "Agents can create parallel architectures and duplicate helpers when they optimize only for the local prompt.",
  level: "must",
  pack: "ai",
  status: "stable",
  tags: ["ai", "architecture"],
  bad: {
    language: "ts",
    code: '// New parallel data-access pattern.\nconst response = await fetch("/api/users");\nconst users = await response.json();',
  },
  good: {
    language: "ts",
    code: "// Reuse the project's established boundary.\nconst users = await userRepository.list();",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
