export const rulePackLayouts = [
  {
    pack: "accessibility",
    directory: "accessibility",
    prefix: "A11Y",
    exportName: "accessibilityRules",
    analyzer: true,
  },
  { pack: "ai", directory: "ai", prefix: "AI", exportName: "aiRules" },
  {
    pack: "apollo",
    directory: "apollo",
    prefix: "APOLLO",
    exportName: "apolloRules",
  },
  {
    pack: "architecture",
    directory: "architecture",
    prefix: "ARCH",
    exportName: "architectureRules",
  },
  {
    pack: "core",
    directory: "core",
    prefix: "CORE",
    exportName: "coreRules",
    analyzer: true,
  },
  { pack: "css", directory: "css", prefix: "CSS", exportName: "cssRules" },
  {
    pack: "dependencies",
    directory: "dependencies",
    prefix: "DEP",
    exportName: "dependencyRules",
  },
  {
    pack: "feature-flags",
    directory: "feature-flags",
    prefix: "FLAG",
    exportName: "featureFlagRules",
  },
  {
    pack: "graphql",
    directory: "graphql",
    prefix: "GQL",
    exportName: "graphqlRules",
    analyzer: true,
  },
  {
    pack: "internationalization",
    directory: "internationalization",
    prefix: "I18N",
    exportName: "internationalizationRules",
    analyzer: true,
  },
  {
    pack: "javascript",
    directory: "javascript",
    prefix: "JS",
    exportName: "javascriptRules",
    analyzer: true,
  },
  {
    pack: "legend-state",
    directory: "legend-state",
    prefix: "LEGEND",
    exportName: "legendStateRules",
    analyzer: true,
  },
  {
    pack: "nextjs",
    directory: "nextjs",
    prefix: "NEXT",
    exportName: "nextjsRules",
  },
  {
    pack: "performance",
    directory: "performance",
    prefix: "PERF",
    exportName: "performanceRules",
  },
  {
    pack: "react",
    directory: "react",
    prefix: "REACT",
    exportName: "reactRules",
    analyzer: true,
  },
  {
    pack: "redux",
    directory: "redux",
    prefix: "REDUX",
    exportName: "reduxRules",
  },
  {
    pack: "tanstack-query",
    directory: "tanstack-query",
    prefix: "TQ",
    exportName: "tanstackQueryRules",
  },
  {
    pack: "testing",
    directory: "testing",
    prefix: "TEST",
    exportName: "testingRules",
  },
  {
    pack: "typescript",
    directory: "typescript",
    prefix: "TS",
    exportName: "typescriptRules",
    analyzer: true,
  },
  {
    pack: "workflow",
    directory: "workflow",
    prefix: "WORK",
    exportName: "workflowRules",
  },
];

export const getRuleLayoutById = (ruleId) => {
  const prefix = ruleId.split("-")[0];
  return rulePackLayouts.find((layout) => layout.prefix === prefix) ?? null;
};

export const ruleIdToIdentifier = (ruleId) =>
  ruleId.toLowerCase().replaceAll("-", "");
