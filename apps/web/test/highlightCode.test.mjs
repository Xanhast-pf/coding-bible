import assert from "node:assert/strict";
import test from "node:test";

import { highlightCodeLine } from "../src/utils/highlightCode.ts";

const joinTokens = (tokens) => tokens.map(({ text }) => text).join("");

test("highlightCodeLine preserves source text exactly", () => {
  const source = 'const result = formatUser("Ada", 42); // display name';
  const tokens = highlightCodeLine(source);

  assert.equal(joinTokens(tokens), source);
});

test("highlightCodeLine classifies common syntax roles", () => {
  const tokens = highlightCodeLine('const user = buildUser("Ada");');

  assert.deepEqual(
    tokens.filter(({ kind }) => kind !== "plain"),
    [
      { kind: "keyword", text: "const" },
      { kind: "operator", text: "=" },
      { kind: "function", text: "buildUser" },
      { kind: "string", text: '"Ada"' },
    ],
  );
});
