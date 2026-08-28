import type { CodingRule, RulePack } from "@coding-bible/rules";

export const filterRules = (
  rules: readonly CodingRule[],
  query: string,
  selectedPack: RulePack | "all",
) => {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return rules.filter((rule) => {
    const matchesPack = selectedPack === "all" || rule.pack === selectedPack;

    if (!matchesPack) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchableText = [
      rule.id,
      rule.title,
      rule.summary,
      rule.rationale,
      rule.pack,
      ...rule.tags,
    ]
      .join(" ")
      .toLocaleLowerCase();

    return searchableText.includes(normalizedQuery);
  });
};
