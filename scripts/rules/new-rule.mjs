import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { getRuleLayoutById, ruleIdToIdentifier } from "./layout.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const args = process.argv.slice(2);
const valueFor = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};
const id = valueFor("--id");
const title = valueFor("--title");
const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

if (!id || !title) {
  console.error(
    'Usage: pnpm rule:new -- --id REACT-014 --title "Prefer explicit event ownership"',
  );
  process.exit(1);
}
if (!/^[A-Z0-9]+-\d{3}$/.test(id)) {
  throw new Error(`Invalid rule ID: ${id}`);
}
const layout = getRuleLayoutById(id);
if (!layout) throw new Error(`Unknown rule prefix in ${id}.`);

const directory = path.join(root, "packages/rules/src/rules", layout.directory);
const existing = fs.existsSync(directory)
  ? fs.readdirSync(directory).find((name) => name.startsWith(`${id}-`))
  : null;
if (existing) throw new Error(`${id} already exists as ${existing}.`);

const fileName = `${id}-${slugify(title)}.ts`;
const identifier = `${ruleIdToIdentifier(id)}Rule`;
const content = [
  'import type { CodingRule } from "../../types";',
  "",
  `export const ${identifier} = {`,
  `  id: "${id}",`,
  `  title: ${JSON.stringify(title)},`,
  '  summary: "TODO: explain the rule in one sentence.",',
  '  rationale: "TODO: explain the engineering cost this rule prevents.",',
  '  level: "should",',
  `  pack: "${layout.pack}",`,
  '  status: "draft",',
  '  tags: ["draft"],',
  "  detection: { autoFixable: false, detectable: false },",
  "} satisfies CodingRule;",
  "",
].join("\n");
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, fileName), content);
console.log(`Created packages/rules/src/rules/${layout.directory}/${fileName}`);
const generator = path.join(root, "scripts/rules/generate-registries.mjs");
const generated = spawnSync(process.execPath, [generator], {
  stdio: "inherit",
});
if (generated.status !== 0) {
  process.exit(generated.status ?? 1);
}
console.log(
  "Next: fill in the rule and add DON'T/DO examples before moving it to stable.",
);
