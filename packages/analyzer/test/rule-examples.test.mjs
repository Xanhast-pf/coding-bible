import assert from "node:assert/strict";
import test from "node:test";

import { accessibilityRules } from "../../rules/src/rules/accessibility.ts";
import { coreRules } from "../../rules/src/rules/core.ts";
import { graphqlRules } from "../../rules/src/rules/graphql.ts";
import { javascriptRules } from "../../rules/src/rules/javascript.ts";
import { legendStateRules } from "../../rules/src/rules/legendState.ts";
import { reactRules } from "../../rules/src/rules/react.ts";
import { typescriptRules } from "../../rules/src/rules/typescript.ts";
import { analyze, detectors } from "../src/index.ts";

const analyzerLanguageByExampleLanguage = new Map([
  ["js", "js"],
  ["javascript", "js"],
  ["jsx", "jsx"],
  ["ts", "ts"],
  ["typescript", "ts"],
  ["tsx", "tsx"],
]);

const rules = [
  ...accessibilityRules,
  ...coreRules,
  ...graphqlRules,
  ...javascriptRules,
  ...legendStateRules,
  ...reactRules,
  ...typescriptRules,
];
const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
const automatedRuleIds = [...new Set(detectors.map((detector) => detector.ruleId))].sort();

test("every automated rule catches its own DON'T example", () => {
  assert.equal(automatedRuleIds.length, 19);

  for (const ruleId of automatedRuleIds) {
    const rule = rulesById.get(ruleId);
    assert.ok(rule, `${ruleId} must exist in the rule registry`);
    assert.ok(rule.bad, `${ruleId} must have a DON'T example`);

    const language = analyzerLanguageByExampleLanguage.get(rule.bad.language);
    assert.ok(language, `${ruleId} DON'T example must use an analyzer-supported language`);

    const result = analyze({ language, source: rule.bad.code });
    assert.equal(result.diagnostics.length, 0, `${ruleId} DON'T example must parse cleanly`);
    assert.ok(
      result.findings.some((finding) => finding.ruleId === ruleId),
      `${ruleId} did not flag its own DON'T example`,
    );

    assert.ok(rule.good, `${ruleId} must have a DO example`);
    const goodLanguage = analyzerLanguageByExampleLanguage.get(rule.good.language);
    assert.ok(goodLanguage, `${ruleId} DO example must use an analyzer-supported language`);
    const goodResult = analyze({ language: goodLanguage, source: rule.good.code });
    assert.equal(goodResult.diagnostics.length, 0, `${ruleId} DO example must parse cleanly`);
    assert.deepEqual(
      goodResult.findings,
      [],
      `${ruleId} DO example must remain clean across every applicable automated rule`,
    );
  }
});
