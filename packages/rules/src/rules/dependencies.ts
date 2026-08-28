import type { CodingRule } from "../types";

export const dependencyRules = [
  {
    id: "DEP-001",
    title: "Prefer the platform before a dependency",
    summary:
      "Check whether the language, runtime, browser, or existing stack already solves the problem before adding a package.",
    rationale:
      "Every dependency adds bundle, security, upgrade, compatibility, and maintenance cost that native capabilities do not.",
    level: "should",
    pack: "dependencies",
    status: "stable",
    tags: ["dependencies", "platform"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "DEP-002",
    title: "Justify runtime dependencies",
    summary:
      "A runtime dependency should provide enough durable value to outweigh its bundle size, API surface, security surface, and upgrade cost.",
    rationale:
      "Convenient packages can become long-lived architectural commitments after their original use case disappears.",
    level: "must",
    pack: "dependencies",
    status: "stable",
    tags: ["dependencies", "maintenance", "runtime"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "DEP-003",
    title: "Remove unused dependencies",
    summary:
      "Delete packages when no production, test, build, or tooling path still requires them.",
    rationale:
      "Unused packages continue to consume install time, security attention, and upgrade effort while providing no value.",
    level: "must",
    pack: "dependencies",
    status: "stable",
    tags: ["cleanup", "dependencies"],
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
    id: "DEP-004",
    title: "Avoid duplicate solutions",
    summary:
      "Do not introduce a second library for a capability the project already solves adequately.",
    rationale:
      "Multiple libraries for the same job increase bundle size, cognitive load, inconsistent conventions, and migration cost.",
    level: "should",
    pack: "dependencies",
    status: "stable",
    tags: ["dependencies", "consistency"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
