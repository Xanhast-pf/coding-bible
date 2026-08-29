import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildLlmsFullText,
  buildLlmsText,
  buildRuleSetAgentPrompt,
  createAgentRulesExport,
  rulePacks,
  rules,
  serializeAgentRulesExport,
  serializeAgentRulesJsonSchema,
} from "../packages/rules/src/index.ts";

const canonicalBaseUrl = "https://xanhast-pf.github.io/coding-bible/";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDirectory = resolve(root, "apps/web/public");
const agentsDirectory = resolve(publicDirectory, "agents");
const checkOnly = process.argv.includes("--check");
const prettierCli = resolve(root, "node_modules/prettier/bin/prettier.cjs");
const jsonFiles = new Set(["rules.json", "rules.schema.json"]);
const ensureTrailingNewline = (content) =>
  content.endsWith("\n") ? content : `${content}\n`;

const files = new Map([
  ["llms.txt", buildLlmsText(rules, canonicalBaseUrl)],
  ["llms-full.txt", buildLlmsFullText(rules, canonicalBaseUrl)],
  [
    "rules.json",
    serializeAgentRulesExport(createAgentRulesExport(rules, canonicalBaseUrl)),
  ],
  ["rules.schema.json", serializeAgentRulesJsonSchema(canonicalBaseUrl)],
  [
    "agents/all.txt",
    ensureTrailingNewline(buildRuleSetAgentPrompt(rules, canonicalBaseUrl)),
  ],
]);

for (const pack of rulePacks) {
  const packRules = rules.filter((rule) => rule.pack === pack);

  if (!packRules.length) {
    continue;
  }

  files.set(
    `agents/${pack}.txt`,
    ensureTrailingNewline(buildRuleSetAgentPrompt(packRules, canonicalBaseUrl)),
  );
}

const readGeneratedFile = (relativePath) => {
  const absolutePath = resolve(publicDirectory, relativePath);

  if (!existsSync(absolutePath)) {
    return null;
  }

  return readFileSync(absolutePath, "utf8");
};

const generatedFileMatches = (relativePath, actual, expected) => {
  if (actual === null) {
    return false;
  }

  if (!jsonFiles.has(relativePath)) {
    return actual === expected;
  }

  try {
    return (
      JSON.stringify(JSON.parse(actual)) ===
      JSON.stringify(JSON.parse(expected))
    );
  } catch {
    return false;
  }
};

const formatGeneratedJsonFiles = () => {
  const result = spawnSync(
    process.execPath,
    [
      prettierCli,
      "--write",
      ...[...jsonFiles].map((relativePath) =>
        resolve(publicDirectory, relativePath),
      ),
    ],
    { cwd: root, stdio: "inherit" },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `Prettier exited with status ${result.status ?? "unknown"}.`,
    );
  }
};

if (checkOnly) {
  const staleFiles = [];

  for (const [relativePath, expected] of files) {
    if (
      !generatedFileMatches(
        relativePath,
        readGeneratedFile(relativePath),
        expected,
      )
    ) {
      staleFiles.push(relativePath);
    }
  }

  if (staleFiles.length) {
    process.stderr.write(
      `Agent interface is stale: ${staleFiles.join(", ")}\nRun \`pnpm agent:generate\` and commit the generated files.\n`,
    );
    process.exitCode = 1;
  } else {
    process.stdout.write(`Agent interface is current (${files.size} files).\n`);
  }
} else {
  rmSync(agentsDirectory, { force: true, recursive: true });
  mkdirSync(agentsDirectory, { recursive: true });

  for (const [relativePath, content] of files) {
    const absolutePath = resolve(publicDirectory, relativePath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content);
  }

  formatGeneratedJsonFiles();
  process.stdout.write(`Generated ${files.size} agent interface files.\n`);
}
