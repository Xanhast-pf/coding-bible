import type { CodingRule } from "../../types";

export const js002Rule = {
  id: "JS-002",
  title: "Use optional chaining for genuine nullish access",
  summary:
    "Prefer optional chaining when a value may legitimately be nullish, and avoid it when the contract guarantees the value exists.",
  rationale:
    "Correct optional chaining makes uncertainty explicit. Defensive chaining on guaranteed values hides incorrect types and weakens reasoning.",
  level: "should",
  pack: "javascript",
  status: "stable",
  tags: ["null-safety", "optional-chaining"],
  bad: {
    language: "ts",
    code: "const city = user && user.address && user.address.city;",
  },
  good: { language: "ts", code: "const city = user?.address?.city;" },
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
