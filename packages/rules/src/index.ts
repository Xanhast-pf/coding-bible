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
export * from "./rules/index.ts";
export { defineRuleRegistry } from "./defineRuleRegistry.ts";
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
import {
  accessibilityRules,
  aiRules,
  apolloRules,
  architectureRules,
  coreRules,
  cssRules,
  dependencyRules,
  featureFlagRules,
  graphqlRules,
  internationalizationRules,
  javascriptRules,
  legendStateRules,
  nextjsRules,
  performanceRules,
  reactRules,
  reduxRules,
  tanstackQueryRules,
  testingRules,
  typescriptRules,
  workflowRules,
} from "./rules/index.ts";

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
