import { rulePackLabels } from "./types.ts";
import type { CodeExample, CodingRule } from "./types.ts";

const formatCodeExample = (label: "DO" | "DON'T", example: CodeExample) =>
  `${label}:\n\`\`\`${example.language}\n${example.code}\n\`\`\``;

const formatExceptions = (exceptions: readonly string[] | undefined) => {
  if (!exceptions?.length) {
    return "Exceptions: none documented.";
  }

  return `Exceptions:\n${exceptions.map((exception) => `- ${exception}`).join("\n")}`;
};

const createCanonicalBaseUrl = (baseUrl: string) => {
  const url = new URL(baseUrl);
  url.search = "";
  url.hash = "";

  return url.toString();
};

const createRuleUrl = (baseUrl: string, ruleId: string) => {
  const url = new URL(createCanonicalBaseUrl(baseUrl));
  url.hash = ruleId;

  return url.toString();
};

export const buildRuleAgentPrompt = (rule: CodingRule, ruleUrl: string) => {
  const examples =
    rule.good && rule.bad
      ? `\n\n${formatCodeExample("DO", rule.good)}\n\n${formatCodeExample("DON'T", rule.bad)}`
      : "";

  return `# Coding Bible agent rule: ${rule.id} — ${rule.title}

Canonical source: [${rule.id} — ${rule.title}](${ruleUrl})
Pack: ${rulePackLabels[rule.pack]}
Level: ${rule.level.toUpperCase()}

Apply this rule whenever it is relevant to code you review, plan, generate, or modify.

Rule: ${rule.summary}
Why: ${rule.rationale}

${formatExceptions(rule.exceptions)}${examples}

Agent instructions:
- Treat this rule as an explicit engineering constraint when it applies.
- Prefer the DO pattern and avoid the DON'T pattern; preserve intent rather than copying examples mechanically.
- Do not invent exceptions. If a documented exception or project constraint applies, state the tradeoff explicitly.
- When reporting a violation, cite ${rule.id} and include the canonical source: ${ruleUrl}`;
};

export const buildRuleSetAgentPrompt = (
  selectedRules: readonly CodingRule[],
  canonicalBaseUrl: string,
) => {
  const sourceUrl = createCanonicalBaseUrl(canonicalBaseUrl);
  const formattedRules = selectedRules
    .map((rule) => {
      const ruleUrl = createRuleUrl(sourceUrl, rule.id);
      const exceptions = rule.exceptions?.length
        ? ` Exceptions: ${rule.exceptions.join("; ")}`
        : "";

      return `- ${rule.id} [${rule.level.toUpperCase()}] ${rule.title}\n  Rule: ${rule.summary}\n  Why: ${rule.rationale}${exceptions}\n  Source: [${rule.id}](${ruleUrl})`;
    })
    .join("\n\n");

  return `# Coding Bible agent context

Canonical source: ${sourceUrl}
Rules included: ${selectedRules.length}

Use the following Coding Bible rules as engineering constraints when they are relevant to the code you review, plan, generate, or modify. Apply them by intent, not by blindly matching wording. Do not invent exceptions. If project-specific requirements conflict with a rule, call out the conflict and explain the tradeoff.

${formattedRules}

When reporting violations, cite the rule ID and its canonical source URL.`;
};
