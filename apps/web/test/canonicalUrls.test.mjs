import assert from "node:assert/strict";
import test from "node:test";

import {
  createCanonicalBibleUrl,
  createCanonicalRuleUrl,
} from "../src/utils/canonicalUrls.ts";

test("canonical Bible URLs remove transient filters and hashes", () => {
  assert.equal(
    createCanonicalBibleUrl(
      "https://example.com/coding-bible/?q=hooks&pack=react#REACT-001",
    ),
    "https://example.com/coding-bible/",
  );
});

test("canonical rule URLs point directly to the requested rule", () => {
  assert.equal(
    createCanonicalRuleUrl(
      "https://example.com/coding-bible/?q=hooks&pack=react#REACT-001",
      "TS-004",
    ),
    "https://example.com/coding-bible/#TS-004",
  );
});
