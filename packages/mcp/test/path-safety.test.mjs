import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  resolveInsideRoot,
  resolveRootDirectory,
  toRootRelativePath,
} from "../src/pathSafety.ts";

test("path helpers normalize a valid root and relative path", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "coding-bible-mcp-path-"));
  const resolvedRoot = await resolveRootDirectory(root);

  assert.equal(resolvedRoot, root);
  assert.equal(
    resolveInsideRoot(root, "src/index.ts", "Path"),
    path.join(root, "src/index.ts"),
  );
  assert.equal(
    toRootRelativePath(root, path.join(root, "src/index.ts")),
    "src/index.ts",
  );
});

test("resolveRootDirectory rejects files and resolveInsideRoot rejects traversal", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-mcp-file-root-"),
  );
  const file = path.join(root, "file.txt");
  await writeFile(file, "x");

  await assert.rejects(() => resolveRootDirectory(file), /must be a directory/);
  assert.throws(
    () => resolveInsideRoot(root, "../outside", "Path"),
    /configured MCP root/,
  );
});
