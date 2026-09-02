import assert from "node:assert/strict";
import test from "node:test";

import {
  analyze,
  createAnalyzerCustomRuleDetectors,
  validateAnalyzerConfig,
  validateAnalyzerCustomRules,
} from "../src/index.ts";

const importRule = {
  confidence: "certain",
  id: "ACME-001",
  impact: "high",
  match: { kind: "import", source: "@vendor/raw-analytics" },
  message: "Application code must not import the raw analytics client.",
  rationale:
    "The organization wrapper centralizes consent, event naming, and transport behavior.",
  suggestion: "Import the supported analytics wrapper instead.",
  title: "Use the organization analytics wrapper",
  url: "https://engineering.example.com/standards/ACME-001",
};

test("declarative custom import rules run through the shared analyzer", () => {
  const additionalDetectors = createAnalyzerCustomRuleDetectors([importRule]);
  const result = analyze(
    {
      fileName: "src/analytics.ts",
      language: "ts",
      source:
        'import analytics from "@vendor/raw-analytics";\nanalytics.track("open");\n',
    },
    { additionalDetectors },
  );

  assert.deepEqual(result.ruleIdsChecked.includes("ACME-001"), true);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0]?.ruleId, "ACME-001");
  assert.equal(result.findings[0]?.confidence, "certain");
  assert.equal(result.findings[0]?.impact, "high");
  assert.equal(
    result.findings[0]?.ruleUrl,
    "https://engineering.example.com/standards/ACME-001",
  );
});

test("declarative import rules can protect module prefixes and re-exports", () => {
  const additionalDetectors = createAnalyzerCustomRuleDetectors([
    {
      ...importRule,
      id: "ACME-002",
      match: { kind: "import", mode: "prefix", source: "@internal/private/" },
      url: undefined,
    },
  ]);
  const result = analyze(
    {
      fileName: "src/index.ts",
      language: "ts",
      source: 'export { secret } from "@internal/private/secrets";\n',
    },
    { additionalDetectors },
  );

  assert.equal(result.findings[0]?.ruleId, "ACME-002");
});

test("declarative custom call rules match the literal callee expression", () => {
  const additionalDetectors = createAnalyzerCustomRuleDetectors([
    {
      confidence: "strong",
      contextNote:
        "Platform adapters may intentionally call fetch; configure file overrides when that boundary is approved.",
      id: "ACME-003",
      impact: "medium",
      match: { callee: "fetch", kind: "call" },
      message: "Direct fetch calls bypass the organization HTTP boundary.",
      rationale:
        "The shared HTTP client owns authentication, retries, observability, and error normalization.",
      suggestion: "Use the organization HTTP client.",
      title: "Use the shared HTTP client",
    },
  ]);
  const result = analyze(
    {
      fileName: "src/api.ts",
      language: "ts",
      source: 'export const load = () => fetch("/api/users");\n',
    },
    { additionalDetectors },
  );

  assert.equal(result.findings[0]?.ruleId, "ACME-003");
  assert.equal(result.findings[0]?.confidence, "strong");
});

test("custom rule validation rejects ambiguous contextual policy", () => {
  assert.throws(
    () =>
      validateAnalyzerCustomRules([
        {
          ...importRule,
          confidence: "contextual",
          contextNote: undefined,
        },
      ]),
    /contextNote is required/u,
  );
});

test("project config rejects custom rule IDs that collide with built-ins", () => {
  assert.throws(
    () =>
      validateAnalyzerConfig({
        customRules: [{ ...importRule, id: "TS-001" }],
      }),
    /must not reuse built-in automated rule ID/u,
  );
});

test("project config can assign severity to declared custom rule IDs", () => {
  const config = validateAnalyzerConfig({
    customRules: [importRule],
    rules: { "ACME-001": "warning" },
  });

  assert.equal(config.rules?.["ACME-001"], "warning");
});
