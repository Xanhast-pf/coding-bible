import {
  createAgentRuleUrl,
  rules,
  type RuleLevel,
  type RulePack,
  type RuleStatus,
} from "@coding-bible/rules";

interface FindingRuleMetadata {
  message?: string;
  ruleId: string;
  ruleRationale?: string | null;
  ruleTitle?: string | null;
  ruleUrl?: string | null;
}

export interface McpRuleReference {
  id: string;
  level: RuleLevel | null;
  pack: RulePack | null;
  source: "canonical" | "finding";
  status: RuleStatus | null;
  summary: string;
  title: string;
  url: string | null;
}

const rulesById = new Map(rules.map((rule) => [rule.id, rule]));

const toMetadata = (
  value: string | FindingRuleMetadata,
): FindingRuleMetadata =>
  typeof value === "string" ? { ruleId: value } : value;

export const createRuleReference = (
  value: string | FindingRuleMetadata,
  canonicalBaseUrl: string,
): McpRuleReference => {
  const finding = toMetadata(value);
  const rule = rulesById.get(finding.ruleId);

  if (rule) {
    return {
      id: rule.id,
      level: rule.level,
      pack: rule.pack,
      source: "canonical",
      status: rule.status,
      summary: finding.ruleRationale ?? rule.summary,
      title: finding.ruleTitle ?? rule.title,
      url: finding.ruleUrl ?? createAgentRuleUrl(canonicalBaseUrl, rule.id),
    };
  }

  if (typeof value === "string") {
    throw new Error(`Unknown Coding Bible rule ${finding.ruleId}.`);
  }

  return {
    id: finding.ruleId,
    level: null,
    pack: null,
    source: "finding",
    status: null,
    summary:
      finding.ruleRationale ??
      finding.message ??
      "Custom analyzer rule finding.",
    title: finding.ruleTitle ?? finding.ruleId,
    url: finding.ruleUrl ?? null,
  };
};

export const createRuleReferences = (
  values: Iterable<string | FindingRuleMetadata>,
  canonicalBaseUrl: string,
) => {
  const byId = new Map<string, string | FindingRuleMetadata>();
  for (const value of values) {
    const id = typeof value === "string" ? value : value.ruleId;
    if (!byId.has(id) || typeof byId.get(id) === "string") {
      byId.set(id, value);
    }
  }

  return [...byId.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => createRuleReference(value, canonicalBaseUrl));
};
