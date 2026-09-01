import type { CodingRule } from "../../types";
import { i18n001Rule } from "./I18N-001-localize-user-visible-text.ts";
import { i18n002Rule } from "./I18N-002-parameterize-messages-instead-of-concatenating-sentences.ts";
import { i18n003Rule } from "./I18N-003-use-intl-for-locale-sensitive-formatting.ts";
import { i18n004Rule } from "./I18N-004-design-layouts-for-text-expansion-and-direction.ts";

export const internationalizationRules = [
  i18n001Rule,
  i18n002Rule,
  i18n003Rule,
  i18n004Rule,
] satisfies readonly CodingRule[];
