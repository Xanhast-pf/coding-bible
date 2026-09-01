import type { CodingRule } from "../../types";

export const ai007Rule = {
  id: "AI-007",
  title: "Run the project's checks",
  summary:
    "Generated changes are not complete until the relevant type, lint, test, build, and project-specific validation commands have been run.",
  rationale:
    "AI can produce syntactically plausible changes that fail existing contracts elsewhere in the repository.",
  level: "must",
  pack: "ai",
  status: "stable",
  tags: ["ai", "quality", "verification"],
  bad: {
    language: "bash",
    code: "# Generated files look plausible, so stop here.\ngit status",
  },
  good: {
    language: "bash",
    code: "pnpm typecheck\npnpm lint\npnpm test\npnpm build",
  },
  detection: { autoFixable: false, detectable: false },
} satisfies CodingRule;
