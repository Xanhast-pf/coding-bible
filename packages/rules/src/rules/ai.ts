import type { CodingRule } from "../types";

export const aiRules = [
  {
    id: "AI-001",
    title: "Generated code follows existing architecture",
    summary: "AI output should use established project patterns before introducing new abstractions.",
    rationale:
      "Agents can create parallel architectures and duplicate helpers when they optimize only for the local prompt.",
    level: "must",
    pack: "ai",
    status: "stable",
    tags: ["ai", "architecture"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "AI-002",
    title: "Generated comments must add context",
    summary: "Remove AI comments that merely narrate the code.",
    rationale:
      "Generated narration adds noise quickly and creates stale text maintainers must keep synchronized.",
    level: "must",
    pack: "ai",
    status: "stable",
    tags: ["ai", "comments"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "AI-003",
    title: "Change the smallest coherent surface",
    summary: "Do not expand generated changes into unrelated cleanup or speculative refactors.",
    rationale:
      "Small coherent diffs are easier to validate, review, revert, and debug.",
    level: "should",
    pack: "ai",
    status: "stable",
    tags: ["ai", "review", "scope"],
    detection: { autoFixable: false, detectable: false },
  },
] satisfies readonly CodingRule[];
