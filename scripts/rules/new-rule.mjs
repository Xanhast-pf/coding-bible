import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { getRuleLayoutById, ruleIdToIdentifier } from "./layout.mjs";

const moduleFileName = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(moduleFileName), "../..");
const usage =
  'Usage: pnpm rule:new -- --id REACT-014 --title "Prefer explicit event ownership" [--detector]\n' +
  '       pnpm rule:new -- --id "$RULE_ID" --detector';

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const findPrefixedFile = (directory, id) =>
  fs.existsSync(directory)
    ? (fs.readdirSync(directory).find((name) => name.startsWith(`${id}-`)) ??
      null)
    : null;

export const resolveRuleScaffoldPlan = ({
  rootDirectory,
  id,
  title,
  createDetector,
}) => {
  if (!id) {
    throw new Error("--id is required.");
  }
  if (!/^[A-Z0-9]+-\d{3}$/.test(id)) {
    throw new Error(`Invalid rule ID: ${id}`);
  }

  const layout = getRuleLayoutById(id);
  if (!layout) throw new Error(`Unknown rule prefix in ${id}.`);

  const ruleDirectory = path.join(
    rootDirectory,
    "packages/rules/src/rules",
    layout.directory,
  );
  const existingRuleFile = findPrefixedFile(ruleDirectory, id);

  if (existingRuleFile && !createDetector) {
    throw new Error(`${id} already exists as ${existingRuleFile}.`);
  }
  if (!existingRuleFile && !title) {
    throw new Error("--title is required when creating a new canonical rule.");
  }

  const newRuleSlug = title ? slugify(title) : "";
  if (!existingRuleFile && !newRuleSlug) {
    throw new Error("--title must contain at least one letter or number.");
  }

  const fileName = existingRuleFile ?? `${id}-${newRuleSlug}.ts`;
  const fileSlug = fileName
    .replace(new RegExp(`^${id}-`), "")
    .replace(/\.ts$/, "");
  const detectorDirectory = path.join(
    rootDirectory,
    "packages/analyzer/src/detectors",
    layout.directory,
  );
  const detectorFile = path.join(detectorDirectory, fileName);

  if (createDetector && fs.existsSync(detectorFile)) {
    throw new Error(
      `${id} already has an analyzer module at ${path.relative(rootDirectory, detectorFile)}.`,
    );
  }

  return {
    createCanonicalRule: existingRuleFile === null,
    createDetector,
    detectorDirectory,
    detectorFile,
    fileName,
    fileSlug,
    id,
    layout,
    ruleDirectory,
    ruleFile: path.join(ruleDirectory, fileName),
    title,
  };
};

export const createRuleContent = ({ createDetector, id, layout, title }) => {
  const identifier = `${ruleIdToIdentifier(id)}Rule`;
  return [
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
    createDetector
      ? '  detection: { autoFixable: false, detectable: true, strategy: "ast" },'
      : "  detection: { autoFixable: false, detectable: false },",
    "} satisfies CodingRule;",
    "",
  ].join("\n");
};

export const createDetectorContent = ({ id, fileSlug }) => {
  const detectorIdentifier = `${ruleIdToIdentifier(id)}Detectors`;
  const detectorId = `${id.toLowerCase()}-${fileSlug}`;
  return [
    'import type { Detector } from "../../types.ts";',
    "",
    `export const ${detectorIdentifier} = [`,
    "  {",
    '    dependencyScope: "source-file",',
    `    id: "${detectorId}",`,
    `    ruleId: "${id}",`,
    "    profile: {",
    '      confidence: "contextual",',
    '      contextNote: "TODO: explain what project/runtime context can change the conclusion.",',
    '      impact: "medium",',
    "    },",
    "    analyze: () => {",
    "      // TODO: implement the detector. Keep the finding evidence narrow and deterministic.",
    "      return [];",
    "    },",
    "  },",
    "] satisfies readonly Detector[];",
    "",
  ].join("\n");
};

const run = () => {
  const args = process.argv.slice(2);
  const valueFor = (name) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : null;
  };
  const id = valueFor("--id");
  const title = valueFor("--title");
  const createDetector = args.includes("--detector");

  let plan;
  try {
    plan = resolveRuleScaffoldPlan({
      rootDirectory: root,
      id,
      title,
      createDetector,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${message}\n\n${usage}`);
    process.exitCode = 1;
    return;
  }

  if (plan.createCanonicalRule) {
    fs.mkdirSync(plan.ruleDirectory, { recursive: true });
    fs.writeFileSync(plan.ruleFile, createRuleContent(plan));
    console.log(
      `Created packages/rules/src/rules/${plan.layout.directory}/${plan.fileName}`,
    );
  }

  if (createDetector) {
    fs.mkdirSync(plan.detectorDirectory, { recursive: true });
    fs.writeFileSync(plan.detectorFile, createDetectorContent(plan));
    console.log(
      `Created packages/analyzer/src/detectors/${plan.layout.directory}/${plan.fileName}`,
    );
    if (!plan.createCanonicalRule) {
      console.log(`Reused existing canonical rule ${plan.id}.`);
    }
  }

  const generator = path.join(root, "scripts/rules/generate-registries.mjs");
  const generated = spawnSync(process.execPath, [generator], {
    stdio: "inherit",
  });
  if (generated.status !== 0) {
    process.exitCode = generated.status ?? 1;
    return;
  }
  console.log(
    createDetector
      ? "Next: implement the detector, replace its TODO profile metadata, add or verify DON'T/DO examples, then run pnpm check."
      : "Next: fill in the rule and add DON'T/DO examples before moving it to stable.",
  );
};

if (process.argv[1] && path.resolve(process.argv[1]) === moduleFileName) {
  run();
}
