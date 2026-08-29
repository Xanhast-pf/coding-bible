import path from "node:path";

import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { codingBibleCanonicalUrl, codingBibleMcpVersion } from "./constants.ts";
import { resolveRootDirectory } from "./pathSafety.ts";
import { createCodingBibleMcpServer } from "./server.ts";

export interface McpCliOptions {
  canonicalBaseUrl: string;
  help: boolean;
  rootDirectory: string;
}

export const mcpUsage = `Coding Bible MCP ${codingBibleMcpVersion}

Usage:
  coding-bible-mcp [--root <path>] [--canonical-url <url>]
  coding-bible-mcp --help

Options:
  --root <path>          Bound project/file tools to this directory.
  --canonical-url <url>  Override canonical rule links.
  --help, -h             Show this help.
`;

const readOptionValue = (
  args: readonly string[],
  index: number,
  flag: string,
) => {
  const value = args[index + 1];

  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
};

export const parseMcpArguments = (
  args: readonly string[],
  cwd = process.cwd(),
): McpCliOptions => {
  let rootDirectory = cwd;
  let canonicalBaseUrl = codingBibleCanonicalUrl;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--help" || argument === "-h") {
      return {
        canonicalBaseUrl,
        help: true,
        rootDirectory: path.resolve(rootDirectory),
      };
    }

    if (argument === "--root") {
      rootDirectory = path.resolve(cwd, readOptionValue(args, index, argument));
      index += 1;
      continue;
    }

    if (argument === "--canonical-url") {
      canonicalBaseUrl = new URL(
        readOptionValue(args, index, argument),
      ).toString();
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${argument}`);
  }

  return {
    canonicalBaseUrl,
    help: false,
    rootDirectory,
  };
};

export const runMcpCli = async (args: readonly string[]) => {
  const options = parseMcpArguments(args);

  if (options.help) {
    process.stdout.write(mcpUsage);
    return;
  }

  const rootDirectory = await resolveRootDirectory(options.rootDirectory);

  void serveStdio(() =>
    createCodingBibleMcpServer({
      canonicalBaseUrl: options.canonicalBaseUrl,
      rootDirectory,
    }),
  );

  process.stderr.write(
    `Coding Bible MCP ${codingBibleMcpVersion} running on stdio for ${rootDirectory}\n`,
  );
};
