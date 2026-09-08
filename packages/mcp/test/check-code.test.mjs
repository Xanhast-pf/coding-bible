import assert from "node:assert/strict";
import test from "node:test";

import { checkCode } from "../src/checkCode.ts";

test("checkCode enriches deterministic findings with canonical rule data", () => {
  const result = checkCode(
    {
      code: "const parse = (value: any) => value;",
      language: "ts",
      fileName: "parse.ts",
    },
    { canonicalBaseUrl: "https://example.com/coding-bible/" },
  );

  assert.equal(result.kind, "code-check");
  assert.equal(result.fileName, "parse.ts");
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0]?.ruleId, "TS-001");
  assert.equal(result.findings[0]?.rule.id, "TS-001");
  assert.equal(result.findings[0]?.rule.pack, "typescript");
  assert.equal(result.findings[0]?.rule.status, "stable");
  assert.match(result.findings[0]?.rule.summary ?? "", /type/i);
  assert.equal(
    result.findings[0]?.rule.url,
    "https://example.com/coding-bible/#TS-001",
  );
  assert.match(result.coverageNote, /deterministic analyzer rules/);
});

test("checkCode does not overstate a clean deterministic result", () => {
  const result = checkCode({
    code: "const parse = (value: unknown) => value;",
    language: "ts",
  });

  assert.equal(result.findings.length, 0);
  assert.ok(result.summary.rulesChecked > 0);
  assert.match(
    result.coverageNote,
    /semantic Coding Bible rules still require review/,
  );
});

test("checkCode assigns default file names for CSS and GraphQL snippets", () => {
  const cssResult = checkCode({
    code: ".button { color: red; }",
    language: "css",
  });
  const graphqlResult = checkCode({
    code: "query User { user { id } }",
    language: "graphql",
  });

  assert.equal(cssResult.fileName, "snippet.css");
  assert.equal(graphqlResult.fileName, "snippet.graphql");
});
