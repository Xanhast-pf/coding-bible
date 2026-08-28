export { accessibilityRules } from "./rules/accessibility";
export { aiRules } from "./rules/ai";
export { architectureRules } from "./rules/architecture";
export { coreRules } from "./rules/core";
export { cssRules } from "./rules/css";
export { dependencyRules } from "./rules/dependencies";
export { defineRuleRegistry } from "./defineRuleRegistry";
export { performanceRules } from "./rules/performance";
export { reactRules } from "./rules/react";
export { testingRules } from "./rules/testing";
export { typescriptRules } from "./rules/typescript";
export type {
  CodeExample,
  CodingRule,
  DetectionStrategy,
  RuleDetection,
  RuleLevel,
  RulePack,
  RuleStatus,
} from "./types";
export { ruleLevels, rulePacks, ruleStatuses } from "./types";

import { defineRuleRegistry } from "./defineRuleRegistry";
import { accessibilityRules } from "./rules/accessibility";
import { aiRules } from "./rules/ai";
import { architectureRules } from "./rules/architecture";
import { coreRules } from "./rules/core";
import { cssRules } from "./rules/css";
import { dependencyRules } from "./rules/dependencies";
import { performanceRules } from "./rules/performance";
import { reactRules } from "./rules/react";
import { testingRules } from "./rules/testing";
import { typescriptRules } from "./rules/typescript";

export const rules = defineRuleRegistry([
  ...accessibilityRules,
  ...aiRules,
  ...architectureRules,
  ...coreRules,
  ...cssRules,
  ...dependencyRules,
  ...performanceRules,
  ...reactRules,
  ...testingRules,
  ...typescriptRules,
] as const);
