import type { CodingRule } from "../../types";

export const js004Rule = {
  id: "JS-004",
  title: "Prefer namespace-safe built-ins",
  summary:
    "Use Number.parseInt, Number.isNaN, Object.hasOwn, and other precise modern built-ins instead of ambiguous legacy globals.",
  rationale:
    "Namespaced APIs communicate intent and avoid historical coercion or prototype pitfalls.",
  level: "should",
  pack: "javascript",
  status: "stable",
  tags: ["built-ins", "modern-javascript"],
  bad: { language: "ts", code: "parseInt(value);\nobj.hasOwnProperty(key);" },
  good: {
    language: "ts",
    code: "Number.parseInt(value, 10);\nObject.hasOwn(obj, key);",
  },
  detection: { autoFixable: true, detectable: true, strategy: "lint" },
} satisfies CodingRule;
