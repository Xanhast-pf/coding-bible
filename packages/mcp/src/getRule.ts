import {
  buildRuleAgentPrompt,
  createAgentRuleUrl,
  rules,
  type CodingRule,
} from "@coding-bible/rules";

import { codingBibleCanonicalUrl } from "./constants.ts";

export interface GetRuleResult {
  schemaVersion: 1;
  kind: "rule";
  canonicalUrl: string;
  prompt: string;
  rule: CodingRule;
}

const rulesById = new Map(rules.map((rule) => [rule.id, rule]));

export const getRule = (
  ruleId: string,
  { canonicalBaseUrl = codingBibleCanonicalUrl } = {},
): GetRuleResult | null => {
  const normalizedRuleId = ruleId.trim().toUpperCase();
  const rule = rulesById.get(normalizedRuleId);

  if (!rule) {
    return null;
  }

  const canonicalUrl = createAgentRuleUrl(canonicalBaseUrl, rule.id);

  return {
    schemaVersion: 1,
    kind: "rule",
    canonicalUrl,
    prompt: buildRuleAgentPrompt(rule, canonicalUrl),
    rule,
  };
};
