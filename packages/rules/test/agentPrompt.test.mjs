import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRuleAgentPrompt,
  buildRuleSetAgentPrompt,
} from "../src/agentPrompt.ts";

const rule = {
  bad: { code: "const value: any = input;", language: "typescript" },
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
  exceptions: ["Generated declarations owned by an external tool."],
  good: { code: "const value: unknown = input;", language: "typescript" },
  id: "TS-004",
  level: "must",
  pack: "typescript",
  rationale: "Any disables useful compiler guarantees.",
  status: "stable",
  summary: "Avoid explicit any in application code.",
  tags: ["types", "safety"],
  title: "Avoid explicit any",
};

test("buildRuleAgentPrompt includes guidance, examples, and the canonical link", () => {
  const url = "https://example.com/coding-bible/#TS-004";
  const prompt = buildRuleAgentPrompt(rule, url);

  assert.match(prompt, /Coding Bible agent rule: TS-004/);
  assert.match(prompt, /DO:\n```typescript\nconst value: unknown = input;/);
  assert.match(prompt, /DON'T:\n```typescript\nconst value: any = input;/);
  assert.match(prompt, /Generated declarations owned by an external tool/);
  assert.match(prompt, new RegExp(url.replaceAll("/", "\\/")));
});

test("buildRuleSetAgentPrompt stays compact and links every selected rule", () => {
  const secondRule = {
    ...rule,
    id: "CORE-003",
    level: "should",
    pack: "core",
    title: "Prefer const",
  };
  const prompt = buildRuleSetAgentPrompt(
    [rule, secondRule],
    "https://example.com/coding-bible/?q=ignored#old",
  );

  assert.match(prompt, /Rules included: 2/);
  assert.match(prompt, /TS-004 \[MUST\]/);
  assert.match(prompt, /CORE-003 \[SHOULD\]/);
  assert.match(prompt, /https:\/\/example\.com\/coding-bible\/#TS-004/);
  assert.match(prompt, /https:\/\/example\.com\/coding-bible\/#CORE-003/);
  assert.doesNotMatch(prompt, /```typescript/);
  assert.doesNotMatch(prompt, /\?q=ignored/);
});
