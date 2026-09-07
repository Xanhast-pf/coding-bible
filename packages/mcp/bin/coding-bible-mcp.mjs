#!/usr/bin/env node

import { runMcpCli } from "../src/cli.ts";

try {
  await runMcpCli(process.argv.slice(2));
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Coding Bible MCP failed."}\n`,
  );
  process.exitCode = 2;
}
