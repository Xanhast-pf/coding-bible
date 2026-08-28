import type { CodingRule, RulePack } from "./types";

const ruleIdPrefixByPack = {
  accessibility: "A11Y",
  ai: "AI",
  architecture: "ARCH",
  core: "CORE",
  css: "CSS",
  dependencies: "DEP",
  performance: "PERF",
  react: "REACT",
  testing: "TEST",
  typescript: "TS",
} satisfies Record<RulePack, string>;

const ruleIdPattern = /^[A-Z0-9]+-\d{3}$/;

const validateText = (
  errors: string[],
  ruleId: string,
  fieldName: string,
  value: string,
) => {
  if (!value.trim()) {
    errors.push(`${ruleId}: ${fieldName} must not be empty.`);
  }
};

export const defineRuleRegistry = <const Rules extends readonly CodingRule[]>(
  rules: Rules,
): Rules => {
  const errors: string[] = [];
  const seenRuleIds = new Set<string>();

  for (const rule of rules) {
    validateText(errors, rule.id, "title", rule.title);
    validateText(errors, rule.id, "summary", rule.summary);
    validateText(errors, rule.id, "rationale", rule.rationale);

    if (!ruleIdPattern.test(rule.id)) {
      errors.push(`${rule.id}: rule ID must match PREFIX-000.`);
    }

    if (seenRuleIds.has(rule.id)) {
      errors.push(`${rule.id}: duplicate rule ID.`);
    }

    seenRuleIds.add(rule.id);

    const expectedPrefix = ruleIdPrefixByPack[rule.pack];

    if (!rule.id.startsWith(`${expectedPrefix}-`)) {
      errors.push(
        `${rule.id}: pack "${rule.pack}" requires the prefix "${expectedPrefix}-".`,
      );
    }

    if (!rule.tags.length) {
      errors.push(`${rule.id}: at least one tag is required.`);
    }

    if (new Set(rule.tags).size !== rule.tags.length) {
      errors.push(`${rule.id}: tags must be unique.`);
    }

    if (rule.detection.autoFixable && !rule.detection.detectable) {
      errors.push(`${rule.id}: an auto-fixable rule must also be detectable.`);
    }

    if (rule.detection.detectable && !rule.detection.strategy) {
      errors.push(`${rule.id}: detectable rules require a detection strategy.`);
    }

    if (!rule.detection.detectable && rule.detection.strategy) {
      errors.push(
        `${rule.id}: a non-detectable rule must not declare a detection strategy.`,
      );
    }

    for (const example of [rule.bad, rule.good]) {
      if (!example) {
        continue;
      }

      validateText(errors, rule.id, "example language", example.language);
      validateText(errors, rule.id, "example code", example.code);
    }
  }

  if (errors.length) {
    throw new Error(
      `Invalid Coding Bible rule registry:\n\n${errors.join("\n")}`,
    );
  }

  return rules;
};
