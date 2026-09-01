import type { CodingRule } from "../../types";
import { a11y001Rule } from "./A11Y-001-prefer-semantic-html.ts";
import { a11y002Rule } from "./A11Y-002-keyboard-access-is-mandatory.ts";
import { a11y003Rule } from "./A11Y-003-keep-focus-visible.ts";
import { a11y004Rule } from "./A11Y-004-controls-need-accessible-names.ts";
import { a11y005Rule } from "./A11Y-005-do-not-communicate-with-color-alone.ts";
import { a11y006Rule } from "./A11Y-006-respect-reduced-motion-preferences.ts";

export const accessibilityRules = [
  a11y001Rule,
  a11y002Rule,
  a11y003Rule,
  a11y004Rule,
  a11y005Rule,
  a11y006Rule,
] satisfies readonly CodingRule[];
