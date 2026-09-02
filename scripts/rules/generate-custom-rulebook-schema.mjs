import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import * as prettier from "prettier";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const outputPath = path.join(
  root,
  "apps/web/public/custom-rulebook.schema.json",
);
const checkOnly = process.argv.includes("--check");

const ruleProperties = {
  confidence: {
    description:
      "How strongly static evidence supports the finding. Use contextual when project/runtime context can change the conclusion.",
    enum: ["certain", "strong", "contextual"],
  },
  contextNote: {
    description:
      "What a human or agent must verify before treating a context-sensitive finding as a violation.",
    minLength: 1,
    type: "string",
  },
  id: {
    description:
      "Organization rule ID in PREFIX-000 form, for example ACME-001.",
    pattern: "^[A-Z][A-Z0-9]*-[0-9]{3}$",
    type: "string",
  },
  impact: {
    description: "Expected engineering impact when the finding is valid.",
    enum: ["high", "medium", "low"],
  },
  languages: {
    description:
      "Optional source-language restriction. Omit to use analyzer defaults.",
    items: { enum: ["tsx", "ts", "jsx", "js"] },
    minItems: 1,
    type: "array",
    uniqueItems: true,
  },
  match: {
    oneOf: [
      {
        additionalProperties: false,
        properties: {
          kind: { const: "import" },
          mode: {
            default: "exact",
            description:
              "Exact module match by default; prefix protects a module subtree.",
            enum: ["exact", "prefix"],
          },
          source: {
            description: "Static import/re-export module source to match.",
            minLength: 1,
            type: "string",
          },
        },
        required: ["kind", "source"],
        type: "object",
      },
      {
        additionalProperties: false,
        properties: {
          callee: {
            description:
              "Literal callee expression to match, for example fetch or window.fetch.",
            minLength: 1,
            type: "string",
          },
          kind: { const: "call" },
        },
        required: ["callee", "kind"],
        type: "object",
      },
    ],
  },
  message: {
    description: "Finding message shown when the matcher fires.",
    minLength: 1,
    type: "string",
  },
  rationale: {
    description: "Why the organization enforces this engineering policy.",
    minLength: 1,
    type: "string",
  },
  suggestion: {
    description: "Preferred remediation guidance for humans and AI agents.",
    minLength: 1,
    type: "string",
  },
  title: {
    description: "Short human-readable policy title.",
    minLength: 1,
    type: "string",
  },
  url: {
    description: "Optional HTTPS documentation URL for this organization rule.",
    pattern: "^https://",
    type: "string",
  },
};

export const customRuleBookSchema = {
  $id: "https://xanhast-pf.github.io/coding-bible/custom-rulebook.schema.json",
  $schema: "https://json-schema.org/draft/2020-12/schema",
  additionalProperties: false,
  description:
    "Portable Coding Bible organization rulebook. Runtime validation remains authoritative.",
  properties: {
    $schema: {
      description:
        "Editor schema URI. Generated rulebooks point at Coding Bible's published schema.",
      minLength: 1,
      type: "string",
    },
    formatVersion: {
      const: 1,
      description:
        "Version of the portable Coding Bible custom-rulebook contract.",
    },
    name: {
      description:
        "Stable human-readable rulebook name for this team/policy set.",
      minLength: 1,
      type: "string",
    },
    rules: {
      items: {
        additionalProperties: false,
        allOf: [
          {
            if: {
              properties: { confidence: { const: "contextual" } },
              required: ["confidence"],
            },
            then: { required: ["contextNote"] },
          },
        ],
        properties: ruleProperties,
        required: [
          "confidence",
          "id",
          "impact",
          "match",
          "message",
          "rationale",
          "suggestion",
          "title",
        ],
        type: "object",
      },
      minItems: 1,
      type: "array",
    },
  },
  required: ["formatVersion", "name", "rules"],
  title: "Coding Bible custom rulebook",
  type: "object",
};

const prettierConfig = (await prettier.resolveConfig(outputPath)) ?? {};
const serialized = await prettier.format(JSON.stringify(customRuleBookSchema), {
  ...prettierConfig,
  filepath: outputPath,
});
if (checkOnly) {
  const existing = fs.existsSync(outputPath)
    ? fs.readFileSync(outputPath, "utf8")
    : null;
  if (existing !== serialized) {
    process.stderr.write(
      "Custom rulebook schema is stale. Run `pnpm rulebook:schema:generate`.\n",
    );
    process.exitCode = 1;
  } else {
    process.stdout.write("Custom rulebook schema is current.\n");
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  process.stdout.write(
    `Generated ${path.relative(root, outputPath).replaceAll("\\", "/")}\n`,
  );
}
