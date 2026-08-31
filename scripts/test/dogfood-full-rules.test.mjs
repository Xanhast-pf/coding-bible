import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const hasRuleSelectionFlag = (value) =>
  /(?:^|\s)--(?:exclude-)?rules(?:\s|=|$)/u.test(value);

const getCodingBibleActionBlocks = (workflow) => {
  const lines = workflow.split(/\r?\n/u);
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line?.match(/^\s*uses:\s*(?:\.\/|Xanhast-pf\/coding-bible@)/u)) {
      continue;
    }

    const indent = line.match(/^\s*/u)?.[0].length ?? 0;
    const block = [line];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidate = lines[cursor] ?? "";
      const candidateIndent = candidate.match(/^\s*/u)?.[0].length ?? 0;
      if (candidate.trim() && candidateIndent <= indent) {
        break;
      }
      block.push(candidate);
    }
    blocks.push(block.join("\n"));
  }

  return blocks;
};

test("repository dogfood always runs the complete automated rule set", async () => {
  const packageJson = JSON.parse(
    await readFile(path.join(repositoryRoot, "package.json"), "utf8"),
  );
  const bibleCheck = packageJson.scripts?.["bible:check"] ?? "";

  assert.equal(hasRuleSelectionFlag(bibleCheck), false);
});

test("GitHub Action dogfood does not narrow the automated rule set", async () => {
  const workflow = await readFile(
    path.join(repositoryRoot, ".github/workflows/deploy-pages.yml"),
    "utf8",
  );
  const blocks = getCodingBibleActionBlocks(workflow);

  assert.ok(blocks.length >= 2, "expected local and released dogfood steps");
  for (const block of blocks) {
    assert.doesNotMatch(block, /^\s+(?:exclude-)?rules:\s*/gmu);
  }
});
