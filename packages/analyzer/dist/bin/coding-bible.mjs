#!/usr/bin/env node

import { runCli } from "../cli/run.mjs";

process.exitCode = await runCli(process.argv.slice(2));
