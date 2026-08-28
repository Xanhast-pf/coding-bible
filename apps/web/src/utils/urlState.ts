import {
  ruleLevels,
  rulePacks,
} from "@coding-bible/rules";
import type { RuleLevel, RulePack } from "@coding-bible/rules";

export interface RuleBrowserState {
  level: RuleLevel | "all";
  pack: RulePack | "all";
  query: string;
}

const validLevels = new Set<RuleLevel>(ruleLevels);
const validPacks = new Set<RulePack>(rulePacks);

export const readRuleBrowserState = (): RuleBrowserState => {
  const params = new URLSearchParams(window.location.search);
  const rawLevel = params.get("level");
  const rawPack = params.get("pack");

  return {
    level:
      rawLevel && validLevels.has(rawLevel as RuleLevel)
        ? (rawLevel as RuleLevel)
        : "all",
    pack:
      rawPack && validPacks.has(rawPack as RulePack)
        ? (rawPack as RulePack)
        : "all",
    query: params.get("q") ?? "",
  };
};

export const writeRuleBrowserState = ({
  level,
  pack,
  query,
}: RuleBrowserState) => {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set("q", query.trim());
  }

  if (pack !== "all") {
    params.set("pack", pack);
  }

  if (level !== "all") {
    params.set("level", level);
  }

  const queryString = params.toString();
  const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`;

  window.history.replaceState(null, "", nextUrl);
};
