import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  analyzerRuleIds,
  validateAnalyzerCustomRuleBook,
} from "../../packages/analyzer/src/index.ts";

const args = process.argv.slice(2);
const jsonOutput = args.includes("--json");
const files = args.filter((arg) => arg !== "--json");
const usage = `Usage:
  pnpm rulebook:validate -- <rulebook.json> [more-rulebooks.json ...]
  pnpm rulebook:validate -- --json <rulebook.json> [more-rulebooks.json ...]
`;

if (!files.length || files.includes("--help")) {
  process.stdout.write(usage);
  process.exitCode = files.includes("--help") ? 0 : 2;
} else {
  try {
    const builtInRuleIds = new Set(analyzerRuleIds);
    const seenIds = new Map();
    const summaries = [];

    for (const fileName of files) {
      const resolved = path.resolve(process.cwd(), fileName);
      let parsed;
      try {
        parsed = JSON.parse(fs.readFileSync(resolved, "utf8"));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${fileName}: could not read valid JSON: ${message}`);
      }

      const ruleBook = validateAnalyzerCustomRuleBook(
        parsed,
        `custom rule file "${fileName}"`,
      );
      for (const rule of ruleBook.rules) {
        if (builtInRuleIds.has(rule.id)) {
          throw new Error(
            `${fileName}: custom rule "${rule.id}" collides with a built-in automated rule.`,
          );
        }
        const previous = seenIds.get(rule.id);
        if (previous) {
          throw new Error(
            `${fileName}: custom rule "${rule.id}" duplicates the ID from ${previous}.`,
          );
        }
        seenIds.set(rule.id, fileName);
      }
      summaries.push({
        file: fileName,
        formatVersion: ruleBook.formatVersion,
        name: ruleBook.name,
        ruleIds: ruleBook.rules.map(({ id }) => id),
      });
    }

    if (jsonOutput) {
      process.stdout.write(
        `${JSON.stringify({ rulebooks: summaries }, null, 2)}\n`,
      );
    } else {
      for (const summary of summaries) {
        process.stdout.write(
          `✓ ${summary.file} — ${summary.name} (${summary.ruleIds.length} rule${summary.ruleIds.length === 1 ? "" : "s"}: ${summary.ruleIds.join(", ")})\n`,
        );
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n`);
    process.exitCode = 2;
  }
}
