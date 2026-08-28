export const ruleLevels = ["must", "should", "prefer", "avoid"] as const;
export type RuleLevel = (typeof ruleLevels)[number];

export const rulePacks = [
  "accessibility",
  "ai",
  "apollo",
  "architecture",
  "core",
  "css",
  "dependencies",
  "feature-flags",
  "graphql",
  "internationalization",
  "javascript",
  "legend-state",
  "nextjs",
  "performance",
  "react",
  "redux",
  "tanstack-query",
  "testing",
  "typescript",
  "workflow",
] as const;
export type RulePack = (typeof rulePacks)[number];

export const rulePackLabels = {
  accessibility: "Accessibility",
  ai: "AI",
  apollo: "Apollo Client",
  architecture: "Architecture",
  core: "Core",
  css: "CSS",
  dependencies: "Dependencies",
  "feature-flags": "Feature Flags",
  graphql: "GraphQL",
  internationalization: "Internationalization",
  javascript: "JavaScript",
  "legend-state": "Legend-State",
  nextjs: "Next.js",
  performance: "Performance",
  react: "React",
  redux: "Redux",
  "tanstack-query": "TanStack Query",
  testing: "Testing",
  typescript: "TypeScript",
  workflow: "Workflow",
} satisfies Record<RulePack, string>;

export const rulePackGroups = {
  accessibility: "foundation",
  ai: "quality",
  apollo: "ecosystem",
  architecture: "foundation",
  core: "foundation",
  css: "foundation",
  dependencies: "quality",
  "feature-flags": "quality",
  graphql: "ecosystem",
  internationalization: "quality",
  javascript: "foundation",
  "legend-state": "ecosystem",
  nextjs: "ecosystem",
  performance: "quality",
  react: "ecosystem",
  redux: "ecosystem",
  "tanstack-query": "ecosystem",
  testing: "quality",
  typescript: "foundation",
  workflow: "quality",
} satisfies Record<RulePack, "ecosystem" | "foundation" | "quality">;

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

export interface RuleReference {
  label: string;
  url: string;
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
  references?: readonly RuleReference[];
  detection: RuleDetection;
}
