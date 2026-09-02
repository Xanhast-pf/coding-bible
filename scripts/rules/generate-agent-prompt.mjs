import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { getRuleLayoutById } from "./layout.mjs";

const moduleFileName = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(moduleFileName), "../..");
const templatePath = path.join(
  root,
  "docs/templates/custom-rule-agent-prompt.md",
);
const validModes = new Set(["auto", "declarative", "detector"]);
const ruleIdPattern = /^[A-Z][A-Z0-9]*-\d{3}$/u;

const usage = `Usage:
  pnpm rule:prompt -- --id ACME-004 --title "Use the shared HTTP client" --goal "Describe the engineering policy."

Options:
  --mode <auto|declarative|detector>  Implementation constraint (default: auto)
  --goal-file <path>                 Read the goal from a UTF-8 text file
  --notes <text>                     Add project-specific context
  --notes-file <path>                Read notes from a UTF-8 text file
  --context <path>                   Add a repository path for the agent to inspect (repeatable)
  --output <path>                    Write Markdown to a file instead of stdout
  --help                             Show this help
`;

const requireText = (value, name) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} must be a non-empty string.`);
  }
  return value.trim();
};

const readTextFile = (filePath, name) => {
  const resolved = path.resolve(process.cwd(), requireText(filePath, name));
  try {
    return requireText(fs.readFileSync(resolved, "utf8"), name);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(`${name} must`)) {
      throw error;
    }
    throw new Error(`${name} could not be read: ${resolved}`);
  }
};

const nextValue = (args, index, name) => {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
};

export const parseRuleAgentPromptArgs = (args) => {
  const parsed = {
    context: [],
    goal: null,
    goalFile: null,
    help: false,
    id: null,
    mode: "auto",
    notes: null,
    notesFile: null,
    output: null,
    title: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    switch (arg) {
      case "--help":
        parsed.help = true;
        break;
      case "--id":
        parsed.id = nextValue(args, index, "--id");
        index += 1;
        break;
      case "--title":
        parsed.title = nextValue(args, index, "--title");
        index += 1;
        break;
      case "--goal":
        parsed.goal = nextValue(args, index, "--goal");
        index += 1;
        break;
      case "--goal-file":
        parsed.goalFile = nextValue(args, index, "--goal-file");
        index += 1;
        break;
      case "--notes":
        parsed.notes = nextValue(args, index, "--notes");
        index += 1;
        break;
      case "--notes-file":
        parsed.notesFile = nextValue(args, index, "--notes-file");
        index += 1;
        break;
      case "--mode":
        parsed.mode = nextValue(args, index, "--mode");
        index += 1;
        break;
      case "--context":
        parsed.context.push(nextValue(args, index, "--context"));
        index += 1;
        break;
      case "--output":
        parsed.output = nextValue(args, index, "--output");
        index += 1;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return parsed;
};

const normalizePromptInput = (parsed) => {
  const id = requireText(parsed.id, "--id").toUpperCase();
  if (!ruleIdPattern.test(id)) {
    throw new Error("--id must match PREFIX-000.");
  }

  const title = requireText(parsed.title, "--title");
  if (!validModes.has(parsed.mode)) {
    throw new Error("--mode must be auto, declarative, or detector.");
  }
  if (parsed.goal && parsed.goalFile) {
    throw new Error("Use either --goal or --goal-file, not both.");
  }
  if (parsed.notes && parsed.notesFile) {
    throw new Error("Use either --notes or --notes-file, not both.");
  }

  const goal = parsed.goal
    ? requireText(parsed.goal, "--goal")
    : parsed.goalFile
      ? readTextFile(parsed.goalFile, "--goal-file")
      : null;
  if (!goal) {
    throw new Error("Provide --goal or --goal-file.");
  }

  const notes = parsed.notes
    ? requireText(parsed.notes, "--notes")
    : parsed.notesFile
      ? readTextFile(parsed.notesFile, "--notes-file")
      : "None provided.";

  return {
    context: parsed.context.map((value) => requireText(value, "--context")),
    goal,
    id,
    mode: parsed.mode,
    notes,
    output: parsed.output,
    title,
  };
};

const readCapabilitySource = (relativePath) => {
  try {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
};

const describeCapabilities = () => {
  const configSource = readCapabilitySource("packages/analyzer/src/config.ts");
  const newRuleSource = readCapabilitySource("scripts/rules/new-rule.mjs");
  const customRuleSource = readCapabilitySource(
    "packages/analyzer/src/customRules.ts",
  );
  const rulebookNewSource = readCapabilitySource(
    "scripts/rules/new-rulebook.mjs",
  );
  const rulebookValidateSource = readCapabilitySource(
    "scripts/rules/validate-rulebook.mjs",
  );

  return [
    `- Declarative custom-rule engine: ${customRuleSource ? "available" : "not detected"}.`,
    `- Versioned local rulebooks via \`customRuleFiles\`: ${configSource.includes("customRuleFiles") ? "available" : "not detected in this checkout"}.`,
    `- Rulebook scaffolding / validation: ${rulebookNewSource && rulebookValidateSource ? "available" : "not detected in this checkout"}.`,
    `- \`rule:new --detector\` scaffolding: ${newRuleSource.includes("--detector") ? "available" : "not detected in this checkout"}.`,
    "- The current source files remain authoritative; do not infer unsupported matcher kinds from this capability summary.",
  ].join("\n");
};

const modeGuidance = (mode) => {
  if (mode === "declarative") {
    return [
      "Implement this policy using the existing declarative custom-rule contract only.",
      "Read the current `AnalyzerCustomRuleMatch` type and validator before editing.",
      "If the present DSL cannot represent the rule without approximation, stop and explain why a full detector is required instead of inventing a matcher or weakening the policy.",
    ].join(" ");
  }

  if (mode === "detector") {
    return [
      "Implement this policy as a full analyzer detector.",
      "Still inspect the current declarative matcher contract first and briefly state why it is insufficient; do not create detector complexity when the portable rule DSL can express the policy exactly.",
    ].join(" ");
  }

  return [
    "First decide whether the current declarative custom-rule DSL can express the policy exactly.",
    "Choose the declarative path when it can; otherwise choose a full detector.",
    "State that decision and the evidence for it before modifying code.",
    "Do not add a new matcher merely to avoid writing a detector unless that matcher is broadly reusable, deterministic, and portable across Web, CLI, and Action.",
  ].join(" ");
};

const scopeGuidance = (id) => {
  const layout = getRuleLayoutById(id);
  if (!layout) {
    return [
      "## Rule scope",
      "",
      `\`${id}\` is not a recognized public Coding Bible pack prefix in this checkout.`,
      "Treat it as organization-specific policy. Prefer the declarative custom-rule path.",
      "If it genuinely needs a full detector, keep that detector in a controlled fork/analyzer wrapper until Coding Bible has an explicit trusted plugin contract; do not force an organization-only rule into the universal catalog.",
    ].join("\n");
  }

  return [
    "## Rule scope",
    "",
    `\`${id}\` maps to the public \`${layout.pack}\` pack in this checkout.`,
    "If this is a new canonical rule that needs a detector, the supported scaffold is:",
    "",
    "```bash",
    `pnpm rule:new -- --id ${id} --title ${JSON.stringify("RULE_TITLE_PLACEHOLDER")} --detector`,
    "```",
    "",
    "Replace the placeholder title with the requested title. If the canonical rule already exists, refine the existing rule/detector instead of creating a duplicate ID.",
  ].join("\n");
};

const detectorGuidance = (id, title) => {
  const layout = getRuleLayoutById(id);
  if (!layout) {
    return [
      `The core \`rule:new --detector\` scaffolder does not recognize the \`${id.split("-")[0]}\` prefix.`,
      "For organization-specific executable analysis, use a controlled fork or analyzer wrapper and the additive detector API.",
      "Do not add a fake public pack solely to make the scaffolder accept the ID.",
    ].join("\n");
  }

  return [
    "For a new canonical rule, scaffold the rule and detector together:",
    "",
    "```bash",
    `pnpm rule:new -- --id ${id} --title ${JSON.stringify(title)} --detector`,
    "```",
    "",
    "If that command reports the rule already exists, locate the existing canonical rule and add/refine only the detector and regressions needed for this task.",
  ].join("\n");
};

const formatExtraContext = (context) =>
  context.length
    ? [
        "### Additional repository paths supplied by the developer",
        "",
        ...context.map((item) => `- \`${item}\``),
      ].join("\n")
    : "No additional repository paths were supplied.";

const renderTemplate = (template, values) => {
  let rendered = template;
  for (const [name, value] of Object.entries(values)) {
    rendered = rendered.replaceAll(`{{${name}}}`, value);
  }

  const unresolved = rendered.match(/\{\{[A-Z0-9_]+\}\}/gu);
  if (unresolved) {
    throw new Error(`Unresolved prompt template token: ${unresolved[0]}`);
  }
  return rendered;
};

export const buildRuleAgentPrompt = (input) => {
  const template = fs.readFileSync(templatePath, "utf8");
  const scope = scopeGuidance(input.id).replace(
    '"RULE_TITLE_PLACEHOLDER"',
    JSON.stringify(input.title),
  );

  return renderTemplate(template, {
    CAPABILITIES: describeCapabilities(),
    DETECTOR_GUIDANCE: detectorGuidance(input.id, input.title),
    EXTRA_CONTEXT: formatExtraContext(input.context),
    MODE: input.mode,
    MODE_GUIDANCE: modeGuidance(input.mode),
    NOTES: input.notes,
    RULE_GOAL: input.goal,
    RULE_ID: input.id,
    RULE_TITLE: input.title,
    SCOPE_GUIDANCE: scope,
  });
};

const run = () => {
  const parsed = parseRuleAgentPromptArgs(process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(usage);
    return;
  }

  const input = normalizePromptInput(parsed);
  const prompt = buildRuleAgentPrompt(input);

  if (!input.output || input.output === "-") {
    process.stdout.write(prompt.endsWith("\n") ? prompt : `${prompt}\n`);
    return;
  }

  const outputPath = path.resolve(process.cwd(), input.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, prompt.endsWith("\n") ? prompt : `${prompt}\n`);
  process.stdout.write(`Wrote ${outputPath}\n`);
};

if (process.argv[1] && path.resolve(process.argv[1]) === moduleFileName) {
  try {
    run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n\n${usage}`);
    process.exitCode = 2;
  }
}
