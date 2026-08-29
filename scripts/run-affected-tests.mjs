import { spawnSync } from "node:child_process";
import process from "node:process";
import { planAffectedTests } from "./affected-test-plan.mjs";

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function readStagedFiles() {
  const result = spawnSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMRD", "-z"],
    { encoding: "utf8" },
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? "Unable to read staged files.\n");
    process.exit(result.status ?? 2);
  }

  return (result.stdout ?? "").split("\0").filter(Boolean);
}

function runCommand(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runTests(targets) {
  // The planner itself is part of the commit gate, so its tiny regression suite
  // always runs even when the staged change only touches documentation.
  runCommand("node", [
    "--test",
    "scripts/test/affected-test-plan.test.mjs",
    "scripts/test/precommit.test.mjs",
  ]);

  if (targets.length === 0) {
    process.stdout.write(
      "Affected tests: no test-bearing workspace changed.\n",
    );
    return;
  }

  process.stdout.write(`Affected tests: ${targets.join(", ")}\n`);

  const args = targets.flatMap((target) => ["--filter", target]);
  runCommand(pnpmCommand, [...args, "test"]);
}

const explicitFiles = process.argv.slice(2).filter((arg) => arg !== "--");
const files = explicitFiles.length > 0 ? explicitFiles : readStagedFiles();

runTests(planAffectedTests(files));
