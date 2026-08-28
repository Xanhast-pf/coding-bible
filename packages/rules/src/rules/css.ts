import type { CodingRule } from "../types";

export const cssRules = [
  {
    id: "CSS-001",
    title: "Name styles by role, not appearance",
    summary:
      "Class names should describe what an element is responsible for rather than its current visual treatment.",
    rationale:
      "Role-based names survive visual redesigns and communicate intent without coupling markup to presentation.",
    level: "should",
    pack: "css",
    status: "stable",
    tags: ["css", "naming"],
    bad: {
      language: "css",
      code: ".redBox {}",
    },
    good: {
      language: "css",
      code: ".errorMessage {}",
    },
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
] satisfies readonly CodingRule[];
