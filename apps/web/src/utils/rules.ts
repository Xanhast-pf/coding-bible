import type { CodingRule, RuleLevel, RulePack } from "@coding-bible/rules";

const getRuleSearchText = (rule: CodingRule) => {
  return [
    rule.id,
    rule.title,
    rule.summary,
    rule.rationale,
    rule.pack,
    rule.level,
    ...rule.tags,
    ...(rule.exceptions ?? []),
    rule.bad?.code ?? "",
    rule.good?.code ?? "",
  ]
    .join(" ")
    .toLowerCase();
};

const createCountMap = <Key extends string>(keys: readonly Key[]) => {
  const counts = new Map<Key, number>();

  for (const key of keys) {
    counts.set(key, 0);
  }

  return counts;
};

export const countRulesByLevel = (
  rules: readonly CodingRule[],
  levels: readonly RuleLevel[],
) => {
  const counts = createCountMap(levels);

  for (const rule of rules) {
    counts.set(rule.level, (counts.get(rule.level) ?? 0) + 1);
  }

  return counts;
};

export const countRulesByPack = (
  rules: readonly CodingRule[],
  packs: readonly RulePack[],
) => {
  const counts = createCountMap(packs);

  for (const rule of rules) {
    counts.set(rule.pack, (counts.get(rule.pack) ?? 0) + 1);
  }

  return counts;
};

export const filterRules = (
  rules: readonly CodingRule[],
  query: string,
  selectedPack: RulePack | "all",
  selectedLevel: RuleLevel | "all",
) => {
  const normalizedQuery = query.trim().toLowerCase();

  return rules.filter((rule) => {
    const matchesPack = selectedPack === "all" || rule.pack === selectedPack;
    const matchesLevel =
      selectedLevel === "all" || rule.level === selectedLevel;

    if (!matchesPack || !matchesLevel) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return getRuleSearchText(rule).includes(normalizedQuery);
  });
};
