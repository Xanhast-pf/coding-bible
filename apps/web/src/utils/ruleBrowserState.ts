import type { RuleLevel, RulePack } from "@coding-bible/rules";

export interface RuleBrowserState {
  level: RuleLevel | "all";
  pack: RulePack | "all";
  query: string;
}

const findValidValue = <Value extends string>(
  values: readonly Value[],
  rawValue: string | null,
): Value | undefined => {
  return values.find((value) => value === rawValue);
};

export const parseRuleBrowserState = (
  params: URLSearchParams,
  levels: readonly RuleLevel[],
  packs: readonly RulePack[],
): RuleBrowserState => {
  return {
    level: findValidValue(levels, params.get("level")) ?? "all",
    pack: findValidValue(packs, params.get("pack")) ?? "all",
    query: params.get("q") ?? "",
  };
};

export const createRuleBrowserSearchParams = ({
  level,
  pack,
  query,
}: RuleBrowserState) => {
  const params = new URLSearchParams();
  const normalizedQuery = query.trim();

  if (normalizedQuery) {
    params.set("q", normalizedQuery);
  }

  if (pack !== "all") {
    params.set("pack", pack);
  }

  if (level !== "all") {
    params.set("level", level);
  }

  return params;
};
