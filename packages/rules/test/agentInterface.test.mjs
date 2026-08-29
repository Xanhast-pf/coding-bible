import assert from "node:assert/strict";
import test from "node:test";

import {
  agentInterfaceFormatVersion,
  buildLlmsFullText,
  buildLlmsText,
  createAgentResourceUrl,
  createAgentRulesExport,
  createCanonicalAgentBaseUrl,
  serializeAgentRulesExport,
  serializeAgentRulesJsonSchema,
} from "../src/agentInterface.ts";

const rule = {
  bad: { code: "const value: any = input;", language: "typescript" },
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
  exceptions: ["Generated declarations owned by an external tool."],
  good: { code: "const value: unknown = input;", language: "typescript" },
  id: "TS-004",
  level: "must",
  pack: "typescript",
  rationale: "Any disables useful compiler guarantees.",
  references: [{ label: "TypeScript", url: "https://www.typescriptlang.org/" }],
  status: "stable",
  summary: "Avoid explicit any in application code.",
  tags: ["types", "safety"],
  title: "Avoid explicit any",
};

test("agent URLs strip transient state and keep a project-path trailing slash", () => {
  const baseUrl = "https://example.com/coding-bible?q=react#REACT-001";

  assert.equal(
    createCanonicalAgentBaseUrl(baseUrl),
    "https://example.com/coding-bible/",
  );
  assert.equal(
    createAgentResourceUrl(baseUrl, "rules.json"),
    "https://example.com/coding-bible/rules.json",
  );
});

test("rules export exposes a versioned stable contract with canonical rule URLs", () => {
  const result = createAgentRulesExport(
    [rule],
    "https://example.com/coding-bible/",
  );

  assert.equal(result.formatVersion, agentInterfaceFormatVersion);
  assert.equal(result.ruleCount, 1);
  assert.deepEqual(result.packs, [
    {
      group: "foundation",
      id: "typescript",
      label: "TypeScript",
      ruleCount: 1,
    },
  ]);
  assert.equal(
    result.rules[0]?.canonicalUrl,
    "https://example.com/coding-bible/#TS-004",
  );
  assert.equal(
    result.schema,
    "https://example.com/coding-bible/rules.schema.json",
  );

  const serialized = serializeAgentRulesExport(result);
  assert.equal(serialized.endsWith("\n"), true);
  assert.deepEqual(JSON.parse(serialized), result);
});

test("rules schema pins the current format version", () => {
  const schema = JSON.parse(
    serializeAgentRulesJsonSchema("https://example.com/coding-bible/"),
  );

  assert.equal(
    schema.properties.formatVersion.const,
    agentInterfaceFormatVersion,
  );
  assert.equal(schema.additionalProperties, false);
  assert.match(schema.$id, /rules\.schema\.json$/);
});

test("llms index follows the discovery format and links compact machine resources", () => {
  const content = buildLlmsText([rule], "https://example.com/coding-bible/");

  assert.match(content, /^# Coding Bible\n\n> /);
  assert.match(content, /llms-full\.txt/);
  assert.match(content, /rules\.json/);
  assert.match(content, /rules\.schema\.json/);
  assert.match(content, /agents\/typescript\.txt/);
});

test("llms full context keeps rationale, examples, exceptions, and references", () => {
  const content = buildLlmsFullText(
    [rule],
    "https://example.com/coding-bible/",
  );

  assert.match(content, /### TS-004 — Avoid explicit any/);
  assert.match(content, /Any disables useful compiler guarantees/);
  assert.match(content, /Generated declarations owned by an external tool/);
  assert.match(content, /const value: unknown = input/);
  assert.match(content, /const value: any = input/);
  assert.match(content, /https:\/\/www\.typescriptlang\.org\//);
});
