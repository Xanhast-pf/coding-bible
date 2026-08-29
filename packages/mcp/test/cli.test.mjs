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
  assert.equal(result.printConfig, null);
});

test("parseMcpArguments supports config output and help", () => {
  assert.equal(
    parseMcpArguments(["--print-config", "cursor"]).printConfig,
    "cursor",
  );
  assert.equal(parseMcpArguments(["--help"]).help, true);
});

test("parseMcpArguments rejects invalid options", () => {
  assert.throws(() => parseMcpArguments(["--wat"]), /Unknown option/);
  assert.throws(() => parseMcpArguments(["--root"]), /requires a value/);
  assert.throws(
    () => parseMcpArguments(["--print-config", "unknown"]),
    /Unknown MCP client/,
  );
});
