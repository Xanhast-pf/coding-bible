import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { parseMcpArguments } from "../src/cli.ts";

test("parseMcpArguments resolves root and canonical URL", () => {
  const cwd = path.resolve("/tmp/coding-bible-mcp");
  const result = parseMcpArguments(
    ["--root", "project", "--canonical-url", "https://example.com/bible"],
    cwd,
  );

  assert.equal(result.rootDirectory, path.join(cwd, "project"));
  assert.equal(result.canonicalBaseUrl, "https://example.com/bible");
  assert.equal(result.help, false);
});

test("parseMcpArguments supports help and rejects unknown options", () => {
  assert.equal(parseMcpArguments(["--help"]).help, true);
  assert.throws(() => parseMcpArguments(["--wat"]), /Unknown option/);
  assert.throws(() => parseMcpArguments(["--root"]), /requires a value/);
});
