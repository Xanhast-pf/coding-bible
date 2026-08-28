import { ruleLevels, rulePacks } from "@coding-bible/rules";

import {
  createRuleBrowserSearchParams,
  parseRuleBrowserState,
} from "./ruleBrowserState";
import type { RuleBrowserState } from "./ruleBrowserState";

export const readRuleBrowserState = (): RuleBrowserState => {
  return parseRuleBrowserState(
    new URLSearchParams(window.location.search),
    ruleLevels,
    rulePacks,
  );
};

export const writeRuleBrowserState = (state: RuleBrowserState) => {
  const queryString = createRuleBrowserSearchParams(state).toString();
  const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`;

  window.history.replaceState(null, "", nextUrl);
};
