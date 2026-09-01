import type { CodingRule } from "../../types";

export const ai005Rule = {
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
  bad: {
    language: "tsx",
    code: '// Guessed from memory.\nimport { useAsyncEffect } from "react";\n\nuseAsyncEffect(loadUser, [userId]);',
  },
  good: {
    language: "tsx",
    code: 'import { useEffect } from "react";\n\nuseEffect(() => {\n  void loadUser(userId);\n}, [userId]);',
  },
  detection: { autoFixable: false, detectable: false },
} satisfies CodingRule;
