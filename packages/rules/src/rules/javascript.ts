import type { CodingRule } from "../types";

export const javascriptRules = [
  {
    id: "JS-001",
    title: "Use async only for Promise semantics",
    summary:
      "Do not mark a function async unless it awaits work or intentionally exposes a Promise-returning contract.",
    rationale:
      "async changes the function's return contract and error behavior. Adding it without Promise semantics misleads callers and readers.",
    level: "must",
    pack: "javascript",
    status: "stable",
    tags: ["async", "functions", "promises"],
    bad: {
      language: "ts",
      code: 'async function getStatusLabel() {\n  return "Ready";\n}',
    },
    good: {
      language: "ts",
      code: 'function getStatusLabel() {\n  return "Ready";\n}',
    },
    detection: { autoFixable: true, detectable: true, strategy: "ast" },
  },
  {
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
  },
  {
    id: "JS-003",
    title: "Prefer default parameters for default inputs",
    summary:
      "When undefined should map to a stable default, express that contract in the function signature.",
    rationale:
      "Default parameters centralize input normalization and avoid mutation or guard boilerplate inside the function body.",
    level: "prefer",
    pack: "javascript",
    status: "stable",
    tags: ["defaults", "functions"],
    bad: {
      language: "ts",
      code: "const process = (items?: Item[]) => {\n  items = items ?? [];\n};",
    },
    good: {
      language: "ts",
      code: "const process = (items: Item[] = []) => {\n  // ...\n};",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
  },
  {
    id: "JS-005",
    title: "Scope try/catch to the operation that can fail",
    summary:
      "Keep setup and unrelated transformation outside a try block unless those operations are intentionally part of the same failure boundary.",
    rationale:
      "A narrow catch boundary makes it clear what failed and prevents unrelated programming errors from being mistaken for expected operational failures.",
    level: "should",
    pack: "javascript",
    status: "stable",
    tags: ["errors", "try-catch"],
    bad: {
      language: "ts",
      code: "try {\n  const payload = buildPayload(form);\n  const result = await api.save(payload);\n  renderResult(result);\n} catch {\n  showNetworkError();\n}",
    },
    good: {
      language: "ts",
      code: "const payload = buildPayload(form);\n\nlet result: SaveResult;\ntry {\n  result = await api.save(payload);\n} catch {\n  showNetworkError();\n  return;\n}\n\nrenderResult(result);",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "JS-006",
    title: "Prefer non-mutating collection APIs when mutation is not intended",
    summary:
      "Use APIs such as toSorted, toReversed, and toSpliced when callers should retain the original collection.",
    rationale:
      "Non-mutating operations make ownership explicit and prevent changes from leaking through shared references.",
    level: "prefer",
    pack: "javascript",
    status: "stable",
    tags: ["arrays", "immutability", "modern-javascript"],
    bad: {
      language: "ts",
      code: "const sortedUsers = users.sort(compareUsers);",
    },
    good: {
      language: "ts",
      code: "const sortedUsers = users.toSorted(compareUsers);",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "JS-007",
    title:
      "Use an options object when positional parameters stop being obvious",
    summary:
      "When a function has several same-shaped or optional arguments, prefer one named options object over a long positional signature.",
    rationale:
      "Named arguments make call sites self-documenting and allow the API to evolve without argument-order traps.",
    level: "prefer",
    pack: "javascript",
    status: "stable",
    tags: ["api-design", "functions", "parameters"],
    bad: {
      language: "ts",
      code: 'createReport(data, true, 50, false, "USD");',
    },
    good: {
      language: "ts",
      code: 'createReport({ data, currency: "USD", includeDrafts: true, limit: 50 });',
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
