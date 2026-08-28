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
  {
    id: "ARCH-004",
    title: "Keep side effects at boundaries",
    summary:
      "Prefer pure transformation logic internally and isolate network, storage, clock, DOM, and other side effects behind clear boundaries.",
    rationale:
      "Isolated side effects make behavior easier to test, replay, reason about, and replace.",
    level: "should",
    pack: "architecture",
    status: "stable",
    tags: ["architecture", "side-effects", "testability"],
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
    id: "ARCH-005",
    title: "Keep one source of truth",
    summary:
      "Do not maintain multiple independently writable representations of the same fact.",
    rationale:
      "Duplicated state can drift. A canonical owner with derived views removes synchronization bugs and clarifies responsibility.",
    level: "must",
    pack: "architecture",
    status: "stable",
    tags: ["architecture", "data-flow", "state"],
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
    id: "ARCH-006",
    title: "Do not add pass-through abstractions",
    summary:
      "An abstraction should add meaning, policy, transformation, or a stable boundary rather than merely forward every call unchanged.",
    rationale:
      "Pass-through layers add files and indirection without reducing coupling or complexity.",
    level: "prefer",
    pack: "architecture",
    status: "stable",
    tags: ["abstraction", "architecture", "indirection"],
    exceptions: [
      "A deliberate compatibility boundary or public facade may justify forwarding when it protects consumers from an unstable implementation.",
    ],
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
    id: "ARCH-007",
    title: "Organize around cohesive domains",
    summary:
      "Prefer module boundaries that reflect product or business concepts over generic buckets that accumulate unrelated code.",
    rationale:
      "Domain-oriented structure keeps behavior that changes together physically close and makes ownership easier to discover.",
    level: "should",
    pack: "architecture",
    status: "stable",
    tags: ["architecture", "cohesion", "structure"],
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
] satisfies readonly CodingRule[];
