import type { CodingRule } from "../types";

export const aiRules = [
  {
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
    summary:
      "Do not expand generated changes into unrelated cleanup or speculative refactors.",
    rationale:
      "Small coherent diffs are easier to validate, review, revert, and debug.",
    level: "should",
    pack: "ai",
    status: "stable",
    tags: ["ai", "review", "scope"],
    detection: { autoFixable: false, detectable: false },
  },
  {
    id: "AI-004",
    title: "Inspect before creating",
    summary:
      "Before generating a new helper, component, type, dependency, or pattern, search for an existing solution in the project.",
    rationale:
      "Agents can generate locally correct duplicates because they do not automatically share a human maintainer's memory of the codebase.",
    level: "must",
    pack: "ai",
    status: "stable",
    tags: ["ai", "duplication", "reuse"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "AI-005",
    title: "Verify external APIs",
    summary:
      "Do not invent package exports, framework behavior, command flags, or platform capabilities from memory when they can be verified.",
    rationale:
      "Plausible-looking hallucinated APIs are especially expensive because generated code can appear correct until build or runtime.",
    level: "must",
    pack: "ai",
    status: "stable",
    tags: ["ai", "dependencies", "verification"],
    detection: { autoFixable: false, detectable: false },
  },
  {
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
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
    detection: { autoFixable: false, detectable: false },
  },
] satisfies readonly CodingRule[];
