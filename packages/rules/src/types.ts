export const ruleLevels = ["must", "should", "prefer", "avoid"] as const;
export type RuleLevel = (typeof ruleLevels)[number];

export const rulePacks = [
  "accessibility",
  "ai",
  "architecture",
  "core",
  "css",
  "performance",
  "react",
  "testing",
  "typescript",
] as const;
export type RulePack = (typeof rulePacks)[number];

export const ruleStatuses = ["draft", "stable", "deprecated"] as const;
export type RuleStatus = (typeof ruleStatuses)[number];

export type DetectionStrategy = "ast" | "lint" | "semantic" | "text";

export interface CodeExample {
  code: string;
  language: string;
  note?: string;
}

export interface RuleDetection {
  autoFixable: boolean;
  detectable: boolean;
  strategy?: DetectionStrategy;
}

export interface CodingRule {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  level: RuleLevel;
  pack: RulePack;
  status: RuleStatus;
  tags: readonly string[];
  good?: CodeExample;
  bad?: CodeExample;
  exceptions?: readonly string[];
  detection: RuleDetection;
}
