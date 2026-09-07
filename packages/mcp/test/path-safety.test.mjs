import assert from "node:assert/strict";
import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  resolveExistingInsideRoot,
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

test("resolveExistingInsideRoot rejects file and directory symlink escapes", async () => {
  const parent = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-mcp-symlink-"),
  );
  const root = path.join(parent, "root");
  const outside = path.join(parent, "outside");
  await mkdir(root);
  await mkdir(outside);
  await writeFile(
    path.join(outside, "outside.ts"),
    "export const outside = true;\n",
  );
  await symlink(
    path.join(outside, "outside.ts"),
    path.join(root, "file-link.ts"),
  );
  await symlink(outside, path.join(root, "dir-link"), "dir");

  await assert.rejects(
    () => resolveExistingInsideRoot(root, "file-link.ts", "Path"),
    /configured MCP root/,
  );
  await assert.rejects(
    () => resolveExistingInsideRoot(root, "dir-link", "Path"),
    /configured MCP root/,
  );
});
