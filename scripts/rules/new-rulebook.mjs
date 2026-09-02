import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const idPattern = /^[A-Z][A-Z0-9]*-\d{3}$/u;
const validKinds = new Set(["call", "import"]);
const schemaUrl =
  "https://xanhast-pf.github.io/coding-bible/custom-rulebook.schema.json";

const usage = `Usage:
  pnpm rulebook:new -- --name acme-frontend --id ACME-001 --title "Use the organization analytics wrapper" --kind import --target @vendor/raw-analytics

Options:
  --kind <import|call>     Declarative matcher kind.
  --target <value>         Module source for import, or literal callee for call.
  --prefix                 Use prefix matching for an import target.
  --output <path>          Output JSON path (default: config/coding-bible/<name>.json).
  --force                  Replace an existing output file.
  --help                   Show this help.
`;

const valueFor = (name) => {
  const index = args.indexOf(name);
  if (index < 0) return null;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
};

const requireText = (value, name) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} must be a non-empty string.`);
  }
  return value.trim();
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const run = () => {
  if (args.includes("--help")) {
    process.stdout.write(usage);
    return;
  }

  const name = requireText(valueFor("--name"), "--name");
  const id = requireText(valueFor("--id"), "--id").toUpperCase();
  const title = requireText(valueFor("--title"), "--title");
  const kind = requireText(valueFor("--kind"), "--kind");
  const target = requireText(valueFor("--target"), "--target");
  if (!idPattern.test(id)) {
    throw new Error("--id must match PREFIX-000.");
  }
  if (!validKinds.has(kind)) {
    throw new Error('--kind must be "import" or "call".');
  }
  if (args.includes("--prefix") && kind !== "import") {
    throw new Error("--prefix is valid only with --kind import.");
  }

  const defaultOutput = path.join(
    "config",
    "coding-bible",
    `${slugify(name) || "custom-rules"}.json`,
  );
  const output = path.resolve(
    process.cwd(),
    valueFor("--output") ?? defaultOutput,
  );
  if (path.extname(output).toLowerCase() !== ".json") {
    throw new Error("--output must be a JSON file.");
  }
  if (fs.existsSync(output) && !args.includes("--force")) {
    throw new Error(`${output} already exists. Use --force to replace it.`);
  }

  const match =
    kind === "import"
      ? {
          kind: "import",
          ...(args.includes("--prefix") ? { mode: "prefix" } : {}),
          source: target,
        }
      : { callee: target, kind: "call" };
  const ruleBook = {
    $schema: schemaUrl,
    formatVersion: 1,
    name,
    rules: [
      {
        confidence: "contextual",
        contextNote:
          "TODO: explain what project or runtime context can change the conclusion.",
        id,
        impact: "medium",
        match,
        message: "TODO: explain what this code violates.",
        rationale: "TODO: explain the engineering cost this policy prevents.",
        suggestion: "TODO: explain the preferred remediation.",
        title,
      },
    ],
  };

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(ruleBook, null, 2)}\n`);

  const display = path.relative(process.cwd(), output).replaceAll("\\", "/");
  process.stdout.write(`Created ${display}\n\n`);
  process.stdout.write("Next:\n");
  process.stdout.write(`  1. Replace the TODO guidance in ${display}.\n`);
  process.stdout.write(
    `  2. Add ${JSON.stringify(display)} to customRuleFiles in coding-bible.config.*.\n`,
  );
  process.stdout.write(`  3. Run: pnpm rulebook:validate -- ${display}\n`);
  process.stdout.write(
    `  4. Optional AI handoff: pnpm rule:prompt -- --id ${id} --title ${JSON.stringify(title)} --goal ${JSON.stringify(`Implement the policy described in ${display}.`)} --context ${JSON.stringify(display)}\n`,
  );
};

try {
  run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${message}\n\n${usage}`);
  process.exitCode = 2;
}
