import type { CodingRule } from "../../types";

export const flag002Rule = {
  id: "FLAG-002",
  title: "Delete flags after rollout",
  summary:
    "When rollout is complete, remove the code branches, tests that exist only for the flag, and the remote flag definition.",
  rationale:
    "Completed flags create dead branches and make maintainers reason about product states that can no longer occur.",
  level: "must",
  pack: "feature-flags",
  status: "stable",
  tags: ["cleanup", "feature-flags"],
  bad: {
    language: "ts",
    code: "if (flags.newCheckout) {\n  return renderNewCheckout();\n}\n\nreturn renderLegacyCheckout();",
  },
  good: {
    language: "ts",
    code: "return renderNewCheckout();",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
