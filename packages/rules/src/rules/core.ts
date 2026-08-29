import type { CodingRule } from "../types";

export const coreRules = [
  {
    id: "CORE-001",
    title: "Optimize for understanding",
    summary:
      "Prefer code that communicates intent without requiring reconstruction by the reader.",
    rationale:
      "Code is maintained and reviewed far more often than it is initially written. Readability lowers review cost, defect risk, and onboarding time.",
    level: "must",
    pack: "core",
    status: "stable",
    tags: ["clarity", "maintainability"],
    bad: {
      language: "ts",
      code: "return users.filter((u) => u.a && !u.s).map((u) => u.e);",
    },
    good: {
      language: "ts",
      code: "const activeUsers = users.filter(\n  (user) => user.active && !user.suspended,\n);\n\nreturn activeUsers.map((user) => user.email);",
    },
    detection: { autoFixable: false, detectable: false },
  },
  {
    id: "CORE-002",
    title: "Use descriptive names",
    summary:
      "Names should communicate the role of a value, function, or module.",
    rationale:
      "Descriptive names reduce the surrounding code a reader must inspect to understand behavior.",
    level: "must",
    pack: "core",
    status: "stable",
    tags: ["clarity", "naming"],
    bad: {
      language: "ts",
      code: "strategies.filter((s) => s.goalType);",
    },
    good: {
      language: "ts",
      code: "strategies.filter((strategy) => strategy.goalType);",
    },
    exceptions: [
      "Established mathematical notation in a clearly mathematical scope.",
      "Conventional short names whose meaning is unambiguous in the immediate context.",
    ],
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
    id: "CORE-003",
    title: "Prefer const",
    summary: "Declare bindings with const unless reassignment is required.",
    rationale:
      "Stable bindings reduce the number of state transitions a reader must track and prevent accidental reassignment.",
    level: "must",
    pack: "core",
    status: "stable",
    tags: ["immutability", "variables"],
    bad: { language: "ts", code: "let user = getUser();" },
    good: { language: "ts", code: "const user = getUser();" },
    detection: { autoFixable: true, detectable: true, strategy: "lint" },
  },
  {
    id: "CORE-004",
    title: "Comments explain why",
    summary:
      "Do not narrate obvious code. Document decisions, constraints, and workarounds.",
    rationale:
      "Narrative comments duplicate code and become stale. Decision comments preserve context the implementation cannot express.",
    level: "should",
    pack: "core",
    status: "stable",
    tags: ["comments", "documentation"],
    bad: {
      language: "ts",
      code: "// Filter active users\nconst activeUsers = users.filter((user) => user.active);",
    },
    good: {
      language: "ts",
      code: "// Suspended accounts remain for audit history, so exclude only inactive accounts.\nconst activeUsers = users.filter((user) => user.active);",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "CORE-005",
    title: "Delete dead code",
    summary:
      "Remove unused functions, imports, exports, files, branches, and dependencies when their last real use disappears.",
    rationale:
      "Dead code expands the surface maintainers must understand, obscures what is still supported, and creates false confidence that obsolete paths are tested.",
    level: "must",
    pack: "core",
    status: "stable",
    tags: ["cleanup", "dead-code", "maintainability"],
    bad: {
      language: "ts",
      code: "const calculateLegacyTax = (total: number) => total * 0.07;\n\nexport const calculateTax = (total: number) =>\n  taxService.calculate(total);",
    },
    good: {
      language: "ts",
      code: "export const calculateTax = (total: number) =>\n  taxService.calculate(total);",
    },
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
    id: "CORE-006",
    title: "Name meaningful constants",
    summary:
      "Give unexplained values a name when their meaning, policy, or unit is not obvious from local context.",
    rationale:
      "A named value communicates why a number or string exists and makes policy changes less error-prone.",
    level: "should",
    pack: "core",
    status: "stable",
    tags: ["clarity", "constants"],
    bad: {
      language: "ts",
      code: "if (attempts >= 5) lockAccount();",
    },
    good: {
      language: "ts",
      code: "const MAX_LOGIN_ATTEMPTS = 5;\n\nif (attempts >= MAX_LOGIN_ATTEMPTS) lockAccount();",
    },
    exceptions: [
      "Values whose meaning is inherent to the operation, such as 0 when checking an array length.",
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "CORE-007",
    title: "Keep cohesive code together",
    summary:
      "Place closely related logic together instead of scattering tiny pieces across unnecessary files.",
    rationale:
      "Excessive fragmentation forces readers to jump between files to understand one behavior and can be as harmful as oversized modules.",
    level: "should",
    pack: "core",
    status: "stable",
    tags: ["cohesion", "files", "maintainability"],
    bad: {
      language: "ts",
      code: "// formatPrice.ts\nexport const formatPrice = (value: number) => { /* ... */ };\n\n// getCurrencySymbol.ts\nexport const getCurrencySymbol = (currency: Currency) => { /* ... */ };",
    },
    good: {
      language: "ts",
      code: "// pricing/formatters.ts\nexport const formatPrice = (value: number) => { /* ... */ };\nexport const getCurrencySymbol = (currency: Currency) => { /* ... */ };",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "CORE-008",
    title: "Reduce nesting when it improves clarity",
    summary:
      "Prefer guard clauses and early exits when they make the main control flow easier to follow.",
    rationale:
      "Deep nesting increases the amount of state a reader must hold in mind. Early exits can make the successful path visually obvious.",
    level: "prefer",
    pack: "core",
    status: "stable",
    tags: ["clarity", "control-flow"],
    bad: {
      language: "ts",
      code: "if (user) {\n  if (user.active) {\n    save(user);\n  }\n}",
    },
    good: {
      language: "ts",
      code: "if (!user || !user.active) return;\n\nsave(user);",
    },
    exceptions: [
      "Do not introduce multiple early exits when they make cleanup or transactional behavior harder to reason about.",
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "CORE-009",
    title: "Preserve non-obvious context during refactors",
    summary:
      "When moving code, preserve explanations and constraints that remain relevant to the behavior.",
    rationale:
      "Refactors should change structure without silently deleting historical context that future maintainers still need.",
    level: "must",
    pack: "core",
    status: "stable",
    tags: ["comments", "refactoring"],
    bad: {
      language: "ts",
      code: "const MAX_PAYMENT_RETRIES = 2;\n\nexport const retryPayment = () => { /* ... */ };",
    },
    good: {
      language: "ts",
      code: "// Gateway may duplicate charges after 2 retries; see PAY-1842.\nconst MAX_PAYMENT_RETRIES = 2;\n\nexport const retryPayment = () => { /* ... */ };",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "CORE-010",
    title: "Keep the public surface minimal",
    summary:
      "Do not export functions, types, modules, or abstractions that have no external consumer.",
    rationale:
      "Every export becomes a dependency point that constrains future refactoring and increases the surface maintainers must understand.",
    level: "should",
    pack: "core",
    status: "stable",
    tags: ["api-design", "exports", "maintainability"],
    bad: {
      language: "ts",
      code: "export const normalizeEmail = (email: string) =>\n  email.trim().toLowerCase();\n\nexport const createUser = (email: string) =>\n  repository.create(normalizeEmail(email));",
    },
    good: {
      language: "ts",
      code: "const normalizeEmail = (email: string) =>\n  email.trim().toLowerCase();\n\nexport const createUser = (email: string) =>\n  repository.create(normalizeEmail(email));",
    },
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
    id: "CORE-011",
    title: "Hoist context-free helpers",
    summary:
      "If a helper does not depend on its parent function's local values, define it in a stable outer scope.",
    rationale:
      "Hoisting communicates independence, avoids needless recreation, and makes the helper easier to test or reuse locally.",
    level: "prefer",
    pack: "core",
    status: "stable",
    tags: ["functions", "scope"],
    bad: {
      language: "ts",
      code: "export const buildReport = (rows: Row[]) => {\n  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;\n\n  return rows.map((row) => formatCurrency(row.total));\n};",
    },
    good: {
      language: "ts",
      code: "const formatCurrency = (value: number) => `$${value.toFixed(2)}`;\n\nexport const buildReport = (rows: Row[]) =>\n  rows.map((row) => formatCurrency(row.total));",
    },
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
] satisfies readonly CodingRule[];
