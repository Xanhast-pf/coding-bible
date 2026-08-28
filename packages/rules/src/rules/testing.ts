import type { CodingRule } from "../types";

export const testingRules = [
  {
    id: "TEST-001",
    title: "Test observable behavior",
    summary:
      "Tests should verify a unit's public responsibility rather than reproduce its internal implementation.",
    rationale:
      "Behavior-focused tests survive safe refactors and fail when user-visible or contract-visible behavior actually changes.",
    level: "must",
    pack: "testing",
    status: "stable",
    tags: ["behavior", "testing"],
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
] satisfies readonly CodingRule[];
