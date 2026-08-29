import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { getProjectGuidance } from "../src/projectGuidance.ts";

test("project guidance selects only detected ecosystem packs", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-mcp-guidance-"),
  );
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({
      dependencies: {
        "@apollo/client": "latest",
        next: "latest",
      },
    }),
  );
  await mkdir(path.join(root, "packages", "ui"), { recursive: true });
  await writeFile(
    path.join(root, "packages", "ui", "package.json"),
    JSON.stringify({ dependencies: { react: "latest" } }),
  );

  const result = await getProjectGuidance({}, { rootDirectory: root });
  const detected = new Map(
    result.detectedEcosystems.map(({ evidence, pack }) => [pack, evidence]),
  );

  assert.deepEqual([...detected.keys()].sort(), [
    "apollo",
    "graphql",
    "nextjs",
    "react",
  ]);
  assert.deepEqual(detected.get("apollo"), ["@apollo/client"]);
  assert.deepEqual(detected.get("graphql"), ["@apollo/client"]);
  assert.deepEqual(detected.get("nextjs"), ["next"]);
  assert.deepEqual(detected.get("react"), ["next", "react"]);
  assert.equal(result.selectedPacks.includes("redux"), false);
  assert.equal(result.selectedPacks.includes("typescript"), true);
  assert.ok(result.ruleCount > 0);
  assert.match(result.guidance, /Coding Bible/);
});

test("project guidance accepts a package.json path", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-mcp-manifest-"),
  );
  await writeFile(path.join(root, "package.json"), "{}\n");

  const result = await getProjectGuidance(
    { path: "package.json" },
    { rootDirectory: root },
  );

  assert.equal(result.projectRoot, ".");
  assert.deepEqual(result.manifests, ["package.json"]);
  assert.equal(result.detectedEcosystems.length, 0);
});
