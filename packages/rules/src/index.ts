export {
  buildRuleAgentPrompt,
  buildRuleSetAgentPrompt,
} from "./agentPrompt.ts";
export {
  agentInterfaceFormatVersion,
  buildLlmsFullText,
  buildLlmsText,
  createAgentResourceUrl,
  createAgentRuleUrl,
  createAgentRulesExport,
  createAgentRulesJsonSchema,
  createCanonicalAgentBaseUrl,
  serializeAgentRulesExport,
  serializeAgentRulesJsonSchema,
} from "./agentInterface.ts";
export type {
  AgentRuleExport,
  AgentRulePackExport,
  AgentRulesExport,
} from "./agentInterface.ts";
export { accessibilityRules } from "./rules/accessibility.ts";
export { aiRules } from "./rules/ai.ts";
export { apolloRules } from "./rules/apollo.ts";
export { architectureRules } from "./rules/architecture.ts";
export { coreRules } from "./rules/core.ts";
export { cssRules } from "./rules/css.ts";
export { dependencyRules } from "./rules/dependencies.ts";
export { defineRuleRegistry } from "./defineRuleRegistry.ts";
export { featureFlagRules } from "./rules/featureFlags.ts";
export { graphqlRules } from "./rules/graphql.ts";
export { internationalizationRules } from "./rules/internationalization.ts";
export { javascriptRules } from "./rules/javascript.ts";
export { legendStateRules } from "./rules/legendState.ts";
export { nextjsRules } from "./rules/nextjs.ts";
export { performanceRules } from "./rules/performance.ts";
export { reactRules } from "./rules/react.ts";
export { reduxRules } from "./rules/redux.ts";
export { tanstackQueryRules } from "./rules/tanstackQuery.ts";
export { testingRules } from "./rules/testing.ts";
export { typescriptRules } from "./rules/typescript.ts";
export { workflowRules } from "./rules/workflow.ts";
export type {
  CodeExample,
  CodingRule,
  DetectionStrategy,
  RuleDetection,
  RuleLevel,
  RulePack,
  RuleReference,
  RuleStatus,
} from "./types.ts";
export {
  ruleLevels,
  rulePackGroups,
  rulePackLabels,
  rulePacks,
  ruleStatuses,
} from "./types.ts";

import { defineRuleRegistry } from "./defineRuleRegistry.ts";
import { accessibilityRules } from "./rules/accessibility.ts";
import { aiRules } from "./rules/ai.ts";
import { apolloRules } from "./rules/apollo.ts";
import { architectureRules } from "./rules/architecture.ts";
import { coreRules } from "./rules/core.ts";
import { cssRules } from "./rules/css.ts";
import { dependencyRules } from "./rules/dependencies.ts";
import { featureFlagRules } from "./rules/featureFlags.ts";
import { graphqlRules } from "./rules/graphql.ts";
import { internationalizationRules } from "./rules/internationalization.ts";
import { javascriptRules } from "./rules/javascript.ts";
import { legendStateRules } from "./rules/legendState.ts";
import { nextjsRules } from "./rules/nextjs.ts";
import { performanceRules } from "./rules/performance.ts";
import { reactRules } from "./rules/react.ts";
import { reduxRules } from "./rules/redux.ts";
import { tanstackQueryRules } from "./rules/tanstackQuery.ts";
import { testingRules } from "./rules/testing.ts";
import { typescriptRules } from "./rules/typescript.ts";
import { workflowRules } from "./rules/workflow.ts";

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
