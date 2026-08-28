import type { CodingRule } from "../types";

export const reactRules = [
  {
    id: "REACT-001",
    title: "Keep components focused on presentation",
    summary: "Move substantial transformation, orchestration, and business logic out of component markup.",
    rationale:
      "Separating presentation from behavior keeps components readable and makes logic independently testable.",
    level: "should",
    pack: "react",
    status: "stable",
    tags: ["architecture", "components", "separation-of-concerns"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "REACT-002",
    title: "Do not memoize by reflex",
    summary: "Use memoization when identity matters or profiling demonstrates a meaningful benefit.",
    rationale:
      "Unnecessary memoization adds dependency management and cognitive overhead without guaranteed benefit.",
    level: "prefer",
    pack: "react",
    status: "stable",
    tags: ["performance", "react"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "REACT-003",
    title: "Keep state as local as practical",
    summary: "Use explicit props and local state until multiple consumers genuinely require shared ownership.",
    rationale:
      "Global state hides dependencies. Local state and explicit data flow make ownership easier to understand.",
    level: "prefer",
    pack: "react",
    status: "stable",
    tags: ["architecture", "data-flow", "state"],
    detection: { autoFixable: false, detectable: false },
  },
] satisfies readonly CodingRule[];
