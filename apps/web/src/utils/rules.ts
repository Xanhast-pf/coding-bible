import type {
  CodingRule,
  RuleLevel,
  RulePack,
} from "@coding-bible/rules";

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
    .toLocaleLowerCase();
};

export const countRulesByLevel = (
  rules: readonly CodingRule[],
  levels: readonly RuleLevel[],
) => {
  const counts = Object.fromEntries(
    levels.map((level) => [level, 0]),
  ) as Record<RuleLevel, number>;

  for (const rule of rules) {
    counts[rule.level] += 1;
  }

  return counts;
};

export const countRulesByPack = (
  rules: readonly CodingRule[],
  packs: readonly RulePack[],
) => {
  const counts = Object.fromEntries(
    packs.map((pack) => [pack, 0]),
  ) as Record<RulePack, number>;

  for (const rule of rules) {
    counts[rule.pack] += 1;
  }

  return counts;
};

export const filterRules = (
  rules: readonly CodingRule[],
  query: string,
  selectedPack: RulePack | "all",
  selectedLevel: RuleLevel | "all",
) => {
  const normalizedQuery = query.trim().toLocaleLowerCase();

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
