import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

export function isBypassed(value) {
  if (value === undefined) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const gates = [
  {
    name: "affected tests",
    command: [pnpmCommand, "test:affected"],
    bypass: "SKIP_AFFECTED_TESTS",
  },
  {
    name: "typecheck",
    command: [pnpmCommand, "typecheck"],
    bypass: "SKIP_TYPECHECK",
  },
  {
    name: "agent interface check",
    command: [pnpmCommand, "agent:check"],
    bypass: "SKIP_AGENT_INTERFACE",
  },
  {
    name: "Knip dependency check",
    command: [pnpmCommand, "knip:fast"],
    bypass: "SKIP_KNIP",
  },
  {
    name: "Coding Bible staged check",
    command: [pnpmCommand, "bible:staged"],
    bypass: "SKIP_BIBLE",
  },
];

export function runPrecommit(environment = process.env) {
  for (const gate of gates) {
    if (isBypassed(environment[gate.bypass])) {
      process.stdout.write(`↷ Skipping ${gate.name} (${gate.bypass}=1)\n`);
      continue;
    }

    process.stdout.write(`\n→ ${gate.name}\n`);

    const [command, ...args] = gate.command;
    const result = spawnSync(command, args, { stdio: "inherit" });

    if (result.status !== 0) {
      return result.status ?? 1;
    }
  }

  return 0;
}

const executedDirectly =
  process.argv[1] !== undefined &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (executedDirectly) {
  process.exitCode = runPrecommit();
}
