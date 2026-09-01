import type { CodingRule } from "../types";

export const typescriptRules = [
  {
    id: "TS-001",
    title: "Avoid any",
    summary:
      "Use the narrowest correct type instead of opting out of type safety.",
    rationale:
      "any removes compiler guarantees at the boundary where they are most valuable and lets invalid states spread.",
    level: "must",
    pack: "typescript",
    status: "stable",
    tags: ["safety", "types"],
    bad: {
      language: "ts",
      code: "const buildParams = (params: any) => params;",
    },
    good: {
      language: "ts",
      code: "interface QueryParams {\n  page: number;\n  sortBy: string;\n}\n\nconst buildParams = (params: QueryParams) => params;",
    },
    exceptions: [
      "A tightly scoped third-party interoperability boundary may require a documented exception.",
    ],
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
    id: "TS-002",
    title: "Keep types narrow",
    summary: "Model only states the runtime contract genuinely permits.",
    rationale:
      "Broad unions and unnecessary optional properties force consumers to handle states that cannot occur.",
    level: "must",
    pack: "typescript",
    status: "stable",
    tags: ["safety", "types"],
    bad: { language: "ts", code: "type Status = string;" },
    good: {
      language: "ts",
      code: 'type Status = "active" | "paused";',
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "TS-003",
    title: "Use type-only imports",
    summary: "Use import type when an import exists only in the type system.",
    rationale:
      "Type-only imports communicate intent and prevent accidental runtime coupling or emitted imports.",
    level: "should",
    pack: "typescript",
    status: "stable",
    tags: ["imports", "types"],
    bad: {
      language: "ts",
      code: 'import { User } from "./types";\n\nconst user: User = getUser();',
    },
    good: {
      language: "ts",
      code: 'import type { User } from "./types";',
    },
    detection: { autoFixable: true, detectable: true, strategy: "lint" },
  },
  {
    id: "TS-004",
    title: "Treat untrusted input as unknown",
    summary:
      "Parse and validate external data at a boundary before treating it as an internal domain type.",
    rationale:
      "TypeScript types do not validate network responses, storage values, URL parameters, or other runtime input.",
    level: "must",
    pack: "typescript",
    status: "stable",
    tags: ["boundaries", "safety", "types", "validation"],
    bad: {
      language: "ts",
      code: "const user = response.json() as User;",
    },
    good: {
      language: "ts",
      code: "const payload: unknown = await response.json();\nconst user = parseUser(payload);",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "TS-005",
    title: "Optional means genuinely optional",
    summary:
      "Do not mark properties optional merely to satisfy existing call sites or silence type errors.",
    rationale:
      "Unnecessary optionality pushes null checks to every consumer and permits states the runtime contract may never produce.",
    level: "must",
    pack: "typescript",
    status: "stable",
    tags: ["optionality", "safety", "types"],
    bad: {
      language: "ts",
      code: "interface User {\n  id?: string;\n  email?: string;\n}",
    },
    good: {
      language: "ts",
      code: "interface User {\n  id: string;\n  email: string;\n}",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "TS-006",
    title: "Model variants as discriminated unions",
    summary:
      "When states have different valid fields, model them as explicit variants instead of combinations of unrelated booleans and optional properties.",
    rationale:
      "Discriminated unions make invalid combinations unrepresentable and enable exhaustive handling.",
    level: "prefer",
    pack: "typescript",
    status: "stable",
    tags: ["modeling", "safety", "types"],
    bad: {
      language: "ts",
      code: "interface RequestState {\n  error?: Error;\n  isLoading: boolean;\n  data?: Data;\n}",
    },
    good: {
      language: "ts",
      code: 'type RequestState =\n  | { status: "loading" }\n  | { status: "error"; error: Error }\n  | { status: "success"; data: Data };',
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "TS-007",
    title: "Do not cast to silence the compiler",
    summary:
      "Use narrowing, validation, or a more accurate type instead of asserting a value into the shape you wish it had.",
    rationale:
      "Unchecked assertions can hide a real mismatch between the runtime contract and the type model.",
    level: "must",
    pack: "typescript",
    status: "stable",
    tags: ["assertions", "safety", "types"],
    bad: {
      language: "ts",
      code: "const payload: unknown = readPayload();\nconst user = payload as User;\nrenderUser(user);",
    },
    good: {
      language: "ts",
      code: 'if (!isUser(payload)) {\n  throw new Error("Invalid user payload");\n}\n\nrenderUser(payload);',
    },
    exceptions: [
      "A narrow assertion is acceptable when runtime invariants are stronger than TypeScript can express and that invariant is documented or proven locally.",
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
