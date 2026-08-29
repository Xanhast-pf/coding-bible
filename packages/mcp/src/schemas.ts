import { rulePacks, ruleStatuses } from "@coding-bible/rules";

export const checkCodeInputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    code: {
      type: "string",
      description:
        "Source code to check with Coding Bible's deterministic analyzer.",
    },
    language: {
      type: "string",
      enum: ["tsx", "ts", "jsx", "js"],
      description: "Language/parser mode for the supplied source.",
    },
    fileName: {
      type: "string",
      minLength: 1,
      description:
        "Optional file name used for detector applicability and diagnostics.",
    },
  },
  required: ["code", "language"],
} as const;

export const checkFilesInputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    paths: {
      type: "array",
      minItems: 1,
      maxItems: 64,
      items: { type: "string", minLength: 1 },
      description:
        "Files or directories to scan, relative to the configured MCP root.",
    },
    configPath: {
      type: "string",
      minLength: 1,
      description:
        "Optional Coding Bible config path relative to the MCP root.",
    },
    ignoreBaseline: {
      type: "boolean",
      description:
        "When true, report known baseline findings instead of suppressing them.",
    },
  },
} as const;

export const reviewDiffInputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    diff: {
      type: "string",
      minLength: 1,
      maxLength: 2_000_000,
      description:
        "Standard unified Git diff text. The current working-tree files under the configured MCP root are analyzed, then findings are limited to added or modified lines from this diff.",
    },
    configPath: {
      type: "string",
      minLength: 1,
      description:
        "Optional Coding Bible config path relative to the MCP root.",
    },
    ignoreBaseline: {
      type: "boolean",
      description:
        "When true, include findings already recorded in the project baseline.",
    },
  },
  required: ["diff"],
} as const;

export const searchRulesInputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    query: {
      type: "string",
      minLength: 1,
      maxLength: 200,
      description:
        "Concept, rule ID, title fragment, tag, or framework term to search for.",
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 20,
      description: "Maximum number of ranked rule matches. Defaults to 10.",
    },
    pack: {
      type: "string",
      enum: rulePacks,
      description: "Optional canonical Coding Bible rule-pack filter.",
    },
    status: {
      type: "string",
      enum: [...ruleStatuses, "all"],
      description:
        "Rule lifecycle status to search. Defaults to stable; use all only when draft/deprecated guidance is explicitly useful.",
    },
  },
  required: ["query"],
} as const;

export const getRuleInputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ruleId: {
      type: "string",
      minLength: 1,
      pattern: "^[A-Za-z][A-Za-z0-9]*-[0-9]{3}$",
      description:
        "Stable Coding Bible rule ID, for example TS-001 or REACT-006.",
    },
  },
  required: ["ruleId"],
} as const;

export const getProjectGuidanceInputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    path: {
      type: "string",
      minLength: 1,
      description:
        "Project directory or package.json path relative to the configured MCP root. Defaults to the root.",
    },
  },
} as const;
