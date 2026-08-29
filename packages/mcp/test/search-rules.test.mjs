import assert from "node:assert/strict";
import test from "node:test";

import { searchRules } from "../src/searchRules.ts";

test("searchRules ranks an exact canonical rule ID first", () => {
  const result = searchRules(
    { query: "ts-001" },
    { canonicalBaseUrl: "https://example.com/bible/" },
  );

  assert.equal(result.kind, "rule-search");
  assert.ok(result.totalMatches > 0);
  assert.equal(result.results[0]?.rule.id, "TS-001");
  assert.equal(result.results[0]?.rule.status, "stable");
  assert.equal(
    result.results[0]?.rule.url,
    "https://example.com/bible/#TS-001",
  );
  assert.ok(result.results[0]?.matches.includes("id"));
});

test("searchRules searches engineering concepts and supports pack/status filters", () => {
  const result = searchRules({
    query: "list key",
    pack: "react",
    status: "stable",
    limit: 5,
  });

  assert.ok(result.results.length > 0);
  assert.ok(result.results.length <= 5);
  assert.ok(result.results.every(({ rule }) => rule.pack === "react"));
});

test("searchRules rejects an empty normalized query", () => {
  assert.throws(() => searchRules({ query: "   " }), /cannot be empty/);
});
