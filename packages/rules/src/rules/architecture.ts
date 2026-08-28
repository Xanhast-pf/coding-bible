import type { CodingRule } from "../types";

export const architectureRules = [
  {
    id: "ARCH-001",
    title: "Separate responsibilities",
    summary:
      "Rendering, orchestration, transformation, persistence, and external I/O should have explicit ownership.",
    rationale:
      "Separating responsibilities makes code easier to reason about, test, replace, and review without requiring knowledge of unrelated behavior.",
    level: "must",
    pack: "architecture",
    status: "stable",
    tags: ["architecture", "separation-of-concerns"],
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
    id: "ARCH-002",
    title: "Keep dependencies explicit",
    summary:
      "A module should receive or import the dependencies it actually uses rather than reaching through unrelated layers.",
    rationale:
      "Explicit dependencies expose coupling and make ownership, testing, and replacement easier to understand.",
    level: "should",
    pack: "architecture",
    status: "stable",
    tags: ["architecture", "dependencies"],
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
    id: "ARCH-003",
    title: "Abstract after understanding repetition",
    summary:
      "Do not create a shared abstraction until the repeated behavior and its stable differences are understood.",
    rationale:
      "Small duplication is cheaper than a premature abstraction that couples unrelated use cases and becomes difficult to change.",
    level: "prefer",
    pack: "architecture",
    status: "stable",
    tags: ["abstraction", "architecture", "dry"],
    detection: {
      autoFixable: false,
      detectable: false,
    },
  },
] satisfies readonly CodingRule[];
