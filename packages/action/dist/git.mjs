import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { readGitHubEvent } from "./github.mjs";

const execFileAsync = promisify(execFile);
const zeroSha = /^0+$/u;

export const resolveBaseRef = async ({
  baseRef,
  environment = process.env,
}) => {
  if (baseRef) {
    return baseRef;
  }

  const event = await readGitHubEvent(environment);
  const pullRequestBase = event?.pull_request?.base?.sha;
  if (typeof pullRequestBase === "string" && pullRequestBase) {
    return pullRequestBase;
  }

  const before = event?.before;
  if (typeof before === "string" && before && !zeroSha.test(before)) {
    return before;
  }

  if (environment.GITHUB_BASE_REF) {
    return `origin/${environment.GITHUB_BASE_REF}`;
  }

  return "HEAD^";
};

export const getChangedDiff = async ({ cwd, baseRef, targetPath }) => {
  try {
    const { stdout: resolvedBase } = await execFileAsync(
      "git",
      ["rev-parse", "--verify", "--end-of-options", `${baseRef}^{commit}`],
      { cwd },
    );
    const baseSha = resolvedBase.trim();
    const { stdout } = await execFileAsync(
      "git",
      [
        "-c",
        "core.quotePath=false",
        "diff",
        "--unified=0",
        "--no-ext-diff",
        "--no-renames",
        `${baseSha}...HEAD`,
        "--",
        targetPath,
      ],
      { cwd, maxBuffer: 16 * 1024 * 1024 },
    );
    return stdout;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to diff ${baseRef}...HEAD. Check out enough Git history (for example, actions/checkout with fetch-depth: 0) or set base-ref explicitly. ${detail}`,
    );
  }
};
