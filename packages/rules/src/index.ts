export { accessibilityRules } from "./rules/accessibility";
export { aiRules } from "./rules/ai";
export { apolloRules } from "./rules/apollo";
export { architectureRules } from "./rules/architecture";
export { coreRules } from "./rules/core";
export { cssRules } from "./rules/css";
export { dependencyRules } from "./rules/dependencies";
export { defineRuleRegistry } from "./defineRuleRegistry";
export { featureFlagRules } from "./rules/featureFlags";
export { graphqlRules } from "./rules/graphql";
export { internationalizationRules } from "./rules/internationalization";
export { javascriptRules } from "./rules/javascript";
export { legendStateRules } from "./rules/legendState";
export { nextjsRules } from "./rules/nextjs";
export { performanceRules } from "./rules/performance";
export { reactRules } from "./rules/react";
export { reduxRules } from "./rules/redux";
export { tanstackQueryRules } from "./rules/tanstackQuery";
export { testingRules } from "./rules/testing";
export { typescriptRules } from "./rules/typescript";
export { workflowRules } from "./rules/workflow";
export type {
  CodeExample,
  CodingRule,
  DetectionStrategy,
  RuleDetection,
  RuleLevel,
  RulePack,
  RuleReference,
  RuleStatus,
} from "./types";
export {
  ruleLevels,
  rulePackGroups,
  rulePackLabels,
  rulePacks,
  ruleStatuses,
} from "./types";

import { defineRuleRegistry } from "./defineRuleRegistry";
import { accessibilityRules } from "./rules/accessibility";
import { aiRules } from "./rules/ai";
import { apolloRules } from "./rules/apollo";
import { architectureRules } from "./rules/architecture";
import { coreRules } from "./rules/core";
import { cssRules } from "./rules/css";
import { dependencyRules } from "./rules/dependencies";
import { featureFlagRules } from "./rules/featureFlags";
import { graphqlRules } from "./rules/graphql";
import { internationalizationRules } from "./rules/internationalization";
import { javascriptRules } from "./rules/javascript";
import { legendStateRules } from "./rules/legendState";
import { nextjsRules } from "./rules/nextjs";
import { performanceRules } from "./rules/performance";
import { reactRules } from "./rules/react";
import { reduxRules } from "./rules/redux";
import { tanstackQueryRules } from "./rules/tanstackQuery";
import { testingRules } from "./rules/testing";
import { typescriptRules } from "./rules/typescript";
import { workflowRules } from "./rules/workflow";

export const rules = defineRuleRegistry([
  ...accessibilityRules,
  ...aiRules,
  ...apolloRules,
  ...architectureRules,
  ...coreRules,
  ...cssRules,
  ...dependencyRules,
  ...featureFlagRules,
  ...graphqlRules,
  ...internationalizationRules,
  ...javascriptRules,
  ...legendStateRules,
  ...nextjsRules,
  ...performanceRules,
  ...reactRules,
  ...reduxRules,
  ...tanstackQueryRules,
  ...testingRules,
  ...typescriptRules,
  ...workflowRules,
] as const);
