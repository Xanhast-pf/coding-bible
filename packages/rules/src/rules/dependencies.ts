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
    bad: {
      language: "ts",
      code: "import uniq from \"lodash/uniq\";\n\nconst uniqueIds = uniq(ids);",
    },
    good: {
      language: "ts",
      code: "const uniqueIds = [...new Set(ids)];",
    },
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
    bad: {
      language: "ts",
      code: "// New runtime package for one trivial operation.\nimport isOdd from \"is-odd\";\n\nconst shouldAlternate = isOdd(index);",
    },
    good: {
      language: "ts",
      code: "const shouldAlternate = index % 2 !== 0;",
    },
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
    bad: {
      language: "jsonc",
      code: "{\n  \"dependencies\": {\n    \"date-fns\": \"^4.0.0\",\n    \"moment\": \"^2.0.0\"\n  }\n}\n\n// moment has no remaining imports.",
    },
    good: {
      language: "json",
      code: "{\n  \"dependencies\": {\n    \"date-fns\": \"^4.0.0\"\n  }\n}",
    },
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
    bad: {
      language: "json",
      code: "{\n  \"dependencies\": {\n    \"axios\": \"^1.0.0\",\n    \"ky\": \"^1.0.0\"\n  }\n}",
    },
    good: {
      language: "json",
      code: "{\n  \"dependencies\": {\n    \"ky\": \"^1.0.0\"\n  }\n}",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
