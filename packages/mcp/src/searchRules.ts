import {
  rulePackLabels,
  rules,
  type RulePack,
  type RuleStatus,
} from "@coding-bible/rules";

import { codingBibleCanonicalUrl } from "./constants.ts";
import { createRuleReference, type McpRuleReference } from "./ruleReference.ts";

export interface SearchRulesInput {
  query: string;
  limit?: number;
  pack?: RulePack;
  status?: RuleStatus | "all";
}

export type RuleSearchMatchField =
  "id" | "pack" | "rationale" | "summary" | "tags" | "title";

export interface RuleSearchResultItem {
  matches: readonly RuleSearchMatchField[];
  rule: McpRuleReference;
  score: number;
  tags: readonly string[];
}

export interface SearchRulesResult {
  schemaVersion: 1;
  kind: "rule-search";
  query: string;
  totalMatches: number;
  results: readonly RuleSearchResultItem[];
}

const normalize = (value: string) => value.trim().toLowerCase();
const tokenize = (value: string) =>
  normalize(value)
    .split(/[^a-z0-9]+/u)
    .filter(Boolean);

const scoreText = (
  value: string,
  phrase: string,
  tokens: readonly string[],
  phraseWeight: number,
  tokenWeight: number,
) => {
  const normalized = normalize(value);
  let score = normalized.includes(phrase) ? phraseWeight : 0;

  for (const token of tokens) {
    if (normalized.includes(token)) {
      score += tokenWeight;
    }
  }

  return score;
};

const scoreRule = (
  rule: (typeof rules)[number],
  query: string,
  tokens: readonly string[],
) => {
  const matches = new Set<RuleSearchMatchField>();
  let score = 0;
  const normalizedId = normalize(rule.id);
  const normalizedTitle = normalize(rule.title);

  if (normalizedId === query) {
    score += 1_000;
    matches.add("id");
  } else if (normalizedId.includes(query)) {
    score += 400;
    matches.add("id");
  }

  if (normalizedTitle === query) {
    score += 320;
    matches.add("title");
  }

  const titleScore = scoreText(rule.title, query, tokens, 220, 35);
  if (titleScore) {
    score += titleScore;
    matches.add("title");
  }

  const summaryScore = scoreText(rule.summary, query, tokens, 160, 18);
  if (summaryScore) {
    score += summaryScore;
    matches.add("summary");
  }

  const rationaleScore = scoreText(rule.rationale, query, tokens, 60, 6);
  if (rationaleScore) {
    score += rationaleScore;
    matches.add("rationale");
  }

  const tagScore = rule.tags.reduce((total, tag) => {
    const normalizedTag = normalize(tag);
    if (normalizedTag === query) {
      matches.add("tags");
      return total + 140;
    }

    if (tokens.some((token) => normalizedTag.includes(token))) {
      matches.add("tags");
      return total + 24;
    }

    return total;
  }, 0);
  score += tagScore;

  const packText = `${rule.pack} ${rulePackLabels[rule.pack]}`;
  const packScore = scoreText(packText, query, tokens, 100, 14);
  if (packScore) {
    score += packScore;
    matches.add("pack");
  }

  return { matches: [...matches], score };
};

export const searchRules = (
  input: SearchRulesInput,
  { canonicalBaseUrl = codingBibleCanonicalUrl } = {},
): SearchRulesResult => {
  const query = normalize(input.query);
  if (!query) {
    throw new Error("Rule search query cannot be empty.");
  }

  const tokens = tokenize(query);
  const limit = input.limit ?? 10;
  const status = input.status ?? "stable";
  const matches = rules
    .filter(
      (rule) =>
        (!input.pack || rule.pack === input.pack) &&
        (status === "all" || rule.status === status),
    )
    .map((rule) => ({ rule, ...scoreRule(rule, query, tokens) }))
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.rule.id.localeCompare(right.rule.id),
    );

  return {
    schemaVersion: 1,
    kind: "rule-search",
    query: input.query.trim(),
    totalMatches: matches.length,
    results: matches
      .slice(0, limit)
      .map(({ matches: fields, rule, score }) => ({
        matches: fields,
        rule: createRuleReference(rule.id, canonicalBaseUrl),
        score,
        tags: rule.tags,
      })),
  };
};
