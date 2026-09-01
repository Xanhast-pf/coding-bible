import type { CodingRule } from "../../types";
import { css001Rule } from "./CSS-001-name-styles-by-role-not-appearance.ts";
import { css002Rule } from "./CSS-002-use-tokens-for-shared-visual-decisions.ts";
import { css003Rule } from "./CSS-003-prefer-layout-systems-over-manual-nudges.ts";
import { css004Rule } from "./CSS-004-keep-component-styles-scoped.ts";

export const cssRules = [
  css001Rule,
  css002Rule,
  css003Rule,
  css004Rule,
] satisfies readonly CodingRule[];
