import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const policyPath = path.join(root, "docs/analyzer-automation-policy.json");
const catalogPath = path.join(root, "apps/web/public/rules.json");
const outputPath = path.join(root, "docs/analyzer-automation-matrix.md");
const detectorRoot = path.join(root, "packages/analyzer/src/detectors");
const checkOnly = process.argv.includes("--check");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const policy = readJson(policyPath);
const catalog = readJson(catalogPath);

const automatedRuleIds = new Set();
for (const pack of fs.readdirSync(detectorRoot, { withFileTypes: true })) {
  if (!pack.isDirectory()) continue;
  const directory = path.join(detectorRoot, pack.name);
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || entry.name.startsWith("_")) continue;
    const match = /^([A-Z0-9]+-\d{3})-/u.exec(entry.name);
    if (match) automatedRuleIds.add(match[1]);
  }
}

const catalogById = new Map(catalog.rules.map((rule) => [rule.id, rule]));
const policyById = new Map(policy.rules.map((rule) => [rule.ruleId, rule]));

if (catalog.rules.length !== policy.ruleCount) {
  throw new Error(
    `Automation policy ruleCount ${policy.ruleCount} does not match catalog ${catalog.rules.length}.`,
  );
}

for (const rule of catalog.rules) {
  if (!policyById.has(rule.id)) {
    throw new Error(`Automation policy is missing ${rule.id}.`);
  }
}

for (const rule of policy.rules) {
  if (!catalogById.has(rule.ruleId)) {
    throw new Error(
      `Automation policy references unknown rule ${rule.ruleId}.`,
    );
  }

  const shouldBeAutomated = automatedRuleIds.has(rule.ruleId);
  if ((rule.status === "automated") !== shouldBeAutomated) {
    throw new Error(
      `${rule.ruleId} status is ${rule.status}, but detector discovery says automated=${shouldBeAutomated}.`,
    );
  }
}

const statusOrder = [
  "automated",
  "high-confidence-candidate",
  "contextual-candidate",
  "human-agent-review",
  "external-tool",
];
const statusLabels = new Map([
  ["automated", "Automated"],
  ["high-confidence-candidate", "High-confidence candidate"],
  ["contextual-candidate", "Contextual candidate"],
  ["human-agent-review", "Human / agent review"],
  ["external-tool", "External tool"],
]);

const counts = new Map(
  statusOrder.map((status) => [
    status,
    policy.rules.filter((rule) => rule.status === status).length,
  ]),
);

const rows = [...policy.rules]
  .sort(
    (left, right) =>
      statusOrder.indexOf(left.status) - statusOrder.indexOf(right.status) ||
      right.priorityScore - left.priorityScore ||
      left.ruleId.localeCompare(right.ruleId),
  )
  .map((entry) => {
    const rule = catalogById.get(entry.ruleId);
    return `| \`${entry.ruleId}\` | ${rule.title.replaceAll("|", "\\|")} | \`${rule.pack}\` | ${statusLabels.get(entry.status)} | ${entry.priorityScore} | ${entry.blocker?.replaceAll("|", "\\|") ?? "—"} |`;
  });

const highPriority = policy.rules
  .filter(({ status }) => status === "high-confidence-candidate")
  .sort(
    (left, right) =>
      right.priorityScore - left.priorityScore ||
      left.ruleId.localeCompare(right.ruleId),
  );

const output = `# Analyzer automation matrix

This matrix classifies every stable Coding Bible rule by the level of automation
the analyzer can responsibly claim today. It is generated from
\`docs/analyzer-automation-policy.json\` and the canonical rule catalog.

> ${policy.classificationPrinciple}

## Coverage summary

| Classification | Rules |
| --- | ---: |
${statusOrder.map((status) => `| ${statusLabels.get(status)} | ${counts.get(status)} |`).join("\n")}
| **Total** | **${policy.ruleCount}** |

A rule marked **Automated** has a detector in the shared analyzer and must pass
the independent Canary promotion contract. A **High-confidence candidate** is
next in line for Canary-first detector development. A **Contextual candidate**
may be worth surfacing, but only after its uncertainty can be expressed honestly.
**Human / agent review** rules intentionally remain judgment calls.
**External tool** rules are primarily owned by tools such as TypeScript, Knip,
GraphQL validators, or CI.

## Next high-confidence candidates

| Priority | Rule | Pack | Blocker / required evidence |
| ---: | --- | --- | --- |
${highPriority
  .map((entry, index) => {
    const rule = catalogById.get(entry.ruleId);
    return `| ${index + 1} | \`${entry.ruleId}\` — ${rule.title.replaceAll("|", "\\|")} | \`${rule.pack}\` | ${entry.blocker?.replaceAll("|", "\\|") ?? "—"} |`;
  })
  .join("\n")}

## Full matrix

| Rule | Title | Pack | Classification | Priority | Blocker / rationale |
| --- | --- | --- | --- | ---: | --- |
${rows.join("\n")}

## Promotion rule

Detector development is Canary-first:

1. Add independent violating, valid, adversarial, and contextual cases.
2. Mark the rule as a candidate in Canary.
3. Implement the narrowest defensible detector.
4. Run the Coding Bible repository gate.
5. Run the external Canary torture suite against the exact candidate SHA.
6. Promote the rule to **Automated** only when the candidate and all required
   consumers pass.

Automated coverage is a trust claim, not a progress counter.
`;

if (checkOnly) {
  const existing = fs.existsSync(outputPath)
    ? fs.readFileSync(outputPath, "utf8")
    : null;
  if (existing !== output) {
    process.stderr.write(
      "Analyzer automation matrix is stale. Run `pnpm automation:matrix:generate`.\n",
    );
    process.exitCode = 1;
  } else {
    process.stdout.write("Analyzer automation matrix is current.\n");
  }
} else {
  fs.writeFileSync(outputPath, output);
  process.stdout.write(
    `Generated ${path.relative(root, outputPath).replaceAll("\\", "/")}\n`,
  );
}
