import {
  createAgentRuleUrl,
  rules,
  type RuleLevel,
  type RulePack,
  type RuleStatus,
} from "@coding-bible/rules";

export interface McpRuleReference {
  id: string;
  level: RuleLevel;
  pack: RulePack;
  status: RuleStatus;
  summary: string;
  title: string;
  url: string;
}

const rulesById = new Map(rules.map((rule) => [rule.id, rule]));

export const createRuleReference = (
  ruleId: string,
  canonicalBaseUrl: string,
): McpRuleReference => {
  const rule = rulesById.get(ruleId);

  if (!rule) {
    throw new Error(`Unknown Coding Bible rule ${ruleId}.`);
  }

  return {
    id: rule.id,
    level: rule.level,
    pack: rule.pack,
    status: rule.status,
    summary: rule.summary,
    title: rule.title,
    url: createAgentRuleUrl(canonicalBaseUrl, rule.id),
  };
};

export const createRuleReferences = (
  ruleIds: Iterable<string>,
  canonicalBaseUrl: string,
) =>
  [...new Set(ruleIds)]
    .sort((left, right) => left.localeCompare(right))
    .map((ruleId) => createRuleReference(ruleId, canonicalBaseUrl));
