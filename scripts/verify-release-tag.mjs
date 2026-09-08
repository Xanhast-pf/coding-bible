import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

const fail = (message, exitCode = 1) => {
  process.stderr.write(`${message}\n`);
  process.exitCode = exitCode;
};

const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME;

if (!tag) {
  fail(
    "Release tag is required. Example: pnpm release:tag:check -- v0.28.0",
    2,
  );
} else {
  const match = /^v(\d+\.\d+\.\d+)$/u.exec(tag);

  if (!match) {
    fail(`Release tag must use exact vMAJOR.MINOR.PATCH form: ${tag}`, 2);
  } else {
    const version = match[1];
    const actionVersion = readJson("packages/action/package.json").version;
    const mcpVersion = readJson("packages/mcp/package.json").version;

    if (actionVersion !== version || mcpVersion !== version) {
      fail(
        `Release tag ${tag} does not match source versions: Action ${actionVersion}, MCP ${mcpVersion}.`,
      );
    } else {
      process.stdout.write(
        `Release tag ${tag} matches Action and MCP source versions.\n`,
      );
    }
  }
}
