import type { CodingRule } from "../../types";

export const ai002Rule = {
  id: "AI-002",
  title: "Generated comments must add context",
  summary: "Remove AI comments that merely narrate the code.",
  rationale:
    "Generated narration adds noise quickly and creates stale text maintainers must keep synchronized.",
  level: "must",
  pack: "ai",
  status: "stable",
  tags: ["ai", "comments"],
  bad: {
    language: "ts",
    code: "// Set loading to true.\nsetLoading(true);\n\n// Fetch the user.\nconst user = await userApi.get(id);",
  },
  good: {
    language: "ts",
    code: "// The legacy endpoint can return stale data for ~30s after account merges.\nconst user = await userApi.get(id);",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
