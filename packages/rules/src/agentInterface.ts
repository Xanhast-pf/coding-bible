import {
  ruleLevels,
  rulePackGroups,
  rulePackLabels,
  rulePacks,
  ruleStatuses,
} from "./types.ts";
import type {
  CodeExample,
  CodingRule,
  RuleDetection,
  RuleLevel,
  RulePack,
  RuleReference,
  RuleStatus,
} from "./types.ts";

export const agentInterfaceFormatVersion = 1 as const;

export interface AgentRulePackExport {
  group: "ecosystem" | "foundation" | "quality";
  id: RulePack;
  label: string;
  ruleCount: number;
}

export interface AgentRuleExport {
  bad?: CodeExample;
  canonicalUrl: string;
  detection: RuleDetection;
  exceptions?: readonly string[];
  good?: CodeExample;
  id: string;
  level: RuleLevel;
  pack: RulePack;
  rationale: string;
  references?: readonly RuleReference[];
  status: RuleStatus;
  summary: string;
  tags: readonly string[];
  title: string;
}

export interface AgentRulesExport {
  canonicalSource: string;
  formatVersion: typeof agentInterfaceFormatVersion;
  packs: readonly AgentRulePackExport[];
  ruleCount: number;
  rules: readonly AgentRuleExport[];
  schema: string;
}

const ensureTrailingSlash = (pathname: string) =>
  pathname.endsWith("/") ? pathname : `${pathname}/`;

export const createCanonicalAgentBaseUrl = (baseUrl: string) => {
  const url = new URL(baseUrl);
  url.hash = "";
  url.search = "";
  url.pathname = ensureTrailingSlash(url.pathname);

  return url.toString();
};

export const createAgentResourceUrl = (baseUrl: string, relativePath: string) =>
  new URL(relativePath, createCanonicalAgentBaseUrl(baseUrl)).toString();

export const createAgentRuleUrl = (baseUrl: string, ruleId: string) => {
  const url = new URL(createCanonicalAgentBaseUrl(baseUrl));
  url.hash = ruleId;

  return url.toString();
};

const createRuleExport = (
  rule: CodingRule,
  canonicalBaseUrl: string,
): AgentRuleExport => ({
  ...(rule.bad ? { bad: rule.bad } : {}),
  canonicalUrl: createAgentRuleUrl(canonicalBaseUrl, rule.id),
  detection: rule.detection,
  ...(rule.exceptions ? { exceptions: rule.exceptions } : {}),
  ...(rule.good ? { good: rule.good } : {}),
  id: rule.id,
  level: rule.level,
  pack: rule.pack,
  rationale: rule.rationale,
  ...(rule.references ? { references: rule.references } : {}),
  status: rule.status,
  summary: rule.summary,
  tags: rule.tags,
  title: rule.title,
});

export const createAgentRulesExport = (
  selectedRules: readonly CodingRule[],
  canonicalBaseUrl: string,
): AgentRulesExport => {
  const canonicalSource = createCanonicalAgentBaseUrl(canonicalBaseUrl);
  const packs = rulePacks.flatMap((pack) => {
    const ruleCount = selectedRules.filter((rule) => rule.pack === pack).length;

    if (ruleCount === 0) {
      return [];
    }

    return [
      {
        group: rulePackGroups[pack],
        id: pack,
        label: rulePackLabels[pack],
        ruleCount,
      },
    ];
  });

  return {
    canonicalSource,
    formatVersion: agentInterfaceFormatVersion,
    packs,
    ruleCount: selectedRules.length,
    rules: selectedRules.map((rule) => createRuleExport(rule, canonicalSource)),
    schema: createAgentResourceUrl(canonicalSource, "rules.schema.json"),
  };
};

export const serializeAgentRulesExport = (value: AgentRulesExport) =>
  `${JSON.stringify(value, null, 2)}\n`;

export const createAgentRulesJsonSchema = (canonicalBaseUrl: string) => ({
  $id: createAgentResourceUrl(canonicalBaseUrl, "rules.schema.json"),
  $schema: "https://json-schema.org/draft/2020-12/schema",
  additionalProperties: false,
  properties: {
    canonicalSource: { format: "uri", type: "string" },
    formatVersion: { const: agentInterfaceFormatVersion, type: "integer" },
    packs: {
      items: { $ref: "#/$defs/rulePack" },
      type: "array",
    },
    ruleCount: { minimum: 0, type: "integer" },
    rules: {
      items: { $ref: "#/$defs/rule" },
      type: "array",
    },
    schema: { format: "uri", type: "string" },
  },
  required: [
    "canonicalSource",
    "formatVersion",
    "packs",
    "ruleCount",
    "rules",
    "schema",
  ],
  title: "Coding Bible rule export",
  type: "object",
  $defs: {
    codeExample: {
      additionalProperties: false,
      properties: {
        code: { type: "string" },
        language: { type: "string" },
        note: { type: "string" },
      },
      required: ["code", "language"],
      type: "object",
    },
    detection: {
      additionalProperties: false,
      properties: {
        autoFixable: { type: "boolean" },
        detectable: { type: "boolean" },
        strategy: { enum: ["ast", "lint", "semantic", "text"] },
      },
      required: ["autoFixable", "detectable"],
      type: "object",
    },
    reference: {
      additionalProperties: false,
      properties: {
        label: { type: "string" },
        url: { format: "uri", type: "string" },
      },
      required: ["label", "url"],
      type: "object",
    },
    rule: {
      additionalProperties: false,
      properties: {
        bad: { $ref: "#/$defs/codeExample" },
        canonicalUrl: { format: "uri-reference", type: "string" },
        detection: { $ref: "#/$defs/detection" },
        exceptions: { items: { type: "string" }, type: "array" },
        good: { $ref: "#/$defs/codeExample" },
        id: { pattern: "^[A-Z][A-Z0-9]*-[0-9]{3}$", type: "string" },
        level: { enum: [...ruleLevels] },
        pack: { enum: [...rulePacks] },
        rationale: { type: "string" },
        references: {
          items: { $ref: "#/$defs/reference" },
          type: "array",
        },
        status: { enum: [...ruleStatuses] },
        summary: { type: "string" },
        tags: { items: { type: "string" }, type: "array" },
        title: { type: "string" },
      },
      required: [
        "canonicalUrl",
        "detection",
        "id",
        "level",
        "pack",
        "rationale",
        "status",
        "summary",
        "tags",
        "title",
      ],
      type: "object",
    },
    rulePack: {
      additionalProperties: false,
      properties: {
        group: { enum: ["ecosystem", "foundation", "quality"] },
        id: { enum: [...rulePacks] },
        label: { type: "string" },
        ruleCount: { minimum: 1, type: "integer" },
      },
      required: ["group", "id", "label", "ruleCount"],
      type: "object",
    },
  },
});

export const serializeAgentRulesJsonSchema = (canonicalBaseUrl: string) =>
  `${JSON.stringify(createAgentRulesJsonSchema(canonicalBaseUrl), null, 2)}\n`;

const formatExample = (label: "DO" | "DON'T", example: CodeExample) => {
  const note = example.note ? `\n\nNote: ${example.note}` : "";

  return `**${label}**\n\n\`\`\`${example.language}\n${example.code}\n\`\`\`${note}`;
};

const formatFullRule = (rule: CodingRule, canonicalBaseUrl: string) => {
  const sections = [
    `### ${rule.id} — ${rule.title}`,
    `**Level:** ${rule.level.toUpperCase()}\n\n**Status:** ${rule.status}\n\n**Source:** ${createAgentRuleUrl(canonicalBaseUrl, rule.id)}`,
    `**Rule:** ${rule.summary}`,
    `**Why:** ${rule.rationale}`,
  ];

  if (rule.exceptions?.length) {
    sections.push(
      `**Exceptions:**\n${rule.exceptions.map((exception) => `- ${exception}`).join("\n")}`,
    );
  }

  if (rule.good) {
    sections.push(formatExample("DO", rule.good));
  }

  if (rule.bad) {
    sections.push(formatExample("DON'T", rule.bad));
  }

  if (rule.references?.length) {
    sections.push(
      `**References:**\n${rule.references
        .map((reference) => `- [${reference.label}](${reference.url})`)
        .join("\n")}`,
    );
  }

  return sections.join("\n\n");
};

export const buildLlmsFullText = (
  selectedRules: readonly CodingRule[],
  canonicalBaseUrl: string,
) => {
  const canonicalSource = createCanonicalAgentBaseUrl(canonicalBaseUrl);
  const packSections = rulePacks.flatMap((pack) => {
    const packRules = selectedRules.filter((rule) => rule.pack === pack);

    if (!packRules.length) {
      return [];
    }

    return [
      `## ${rulePackLabels[pack]}\n\n${packRules
        .map((rule) => formatFullRule(rule, canonicalSource))
        .join("\n\n")}`,
    ];
  });

  return `# Coding Bible — full agent context

> Complete human- and agent-readable engineering rules for Coding Bible.

Canonical source: ${canonicalSource}
Rules included: ${selectedRules.length}
JSON contract: ${createAgentResourceUrl(canonicalSource, "rules.json")}

Use these rules as engineering constraints when relevant. Apply them by intent, preserve documented exceptions, and cite the stable rule ID when reporting a violation.

${packSections.join("\n\n")}\n`;
};

export const buildLlmsText = (
  selectedRules: readonly CodingRule[],
  canonicalBaseUrl: string,
) => {
  const canonicalSource = createCanonicalAgentBaseUrl(canonicalBaseUrl);
  const packLinks = rulePacks.flatMap((pack) => {
    const count = selectedRules.filter((rule) => rule.pack === pack).length;

    if (count === 0) {
      return [];
    }

    return [
      `- [${rulePackLabels[pack]} agent context](${createAgentResourceUrl(canonicalSource, `agents/${pack}.txt`)}): ${count} ${count === 1 ? "rule" : "rules"} from the ${rulePackLabels[pack]} pack.`,
    ];
  });

  return `# Coding Bible

> Opinionated, structured engineering standards for software that is easy to understand, difficult to misuse, and pleasant to maintain.

Coding Bible is rules-first. Stable rule IDs, rationale, severity, examples, exceptions, references, and detection metadata live in one canonical registry. Use the compact resources below for machine consumption rather than scraping the rendered website.

## Agent resources

- [Full rule context](${createAgentResourceUrl(canonicalSource, "llms-full.txt")}): Complete Markdown context with all ${selectedRules.length} rules, rationale, examples, exceptions, and references.
- [Rules JSON](${createAgentResourceUrl(canonicalSource, "rules.json")}): Versioned machine-readable rule export.
- [Rules JSON Schema](${createAgentResourceUrl(canonicalSource, "rules.schema.json")}): JSON Schema for the stable export contract.
- [Compact all-rules prompt](${createAgentResourceUrl(canonicalSource, "agents/all.txt")}): Token-conscious agent instructions for the entire current rule set.

## Rule packs

${packLinks.join("\n")}\n`;
};
