import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const runGit = async (cwd, args) => {
  const { stdout } = await execFileAsync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  return stdout.trim();
};

const lines = (value) =>
  value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

const getGitRoot = async (cwd) => {
  try {
    return await runGit(cwd, ["rev-parse", "--show-toplevel"]);
  } catch {
    throw new Error("Git-aware scan modes require a Git repository.");
  }
};

const getUntrackedFiles = async (root) =>
  lines(await runGit(root, ["ls-files", "--others", "--exclude-standard"]));

const getWorkingTreeFiles = async (root) => {
  try {
    return lines(
      await runGit(root, [
        "diff",
        "--name-only",
        "--diff-filter=ACMR",
        "HEAD",
        "--",
      ]),
    );
  } catch {
    return lines(await runGit(root, ["ls-files", "--cached"]));
  }
};

export const getGitScopedFiles = async ({ cwd, mode, ref }) => {
  if (mode === "project") {
    return null;
  }

  const root = await getGitRoot(cwd);
  let relativeFiles = [];

  if (mode === "staged") {
    relativeFiles = lines(
      await runGit(root, [
        "diff",
        "--cached",
        "--name-only",
        "--diff-filter=ACMR",
        "--",
      ]),
    );
  } else if (mode === "changed") {
    relativeFiles = [
      ...(await getWorkingTreeFiles(root)),
      ...(await getUntrackedFiles(root)),
    ];
  } else if (mode === "since") {
    if (!ref) {
      throw new Error(
        "--since requires a Git ref, for example --since origin/main.",
      );
    }

    relativeFiles = [
      ...lines(
        await runGit(root, [
          "diff",
          "--name-only",
          "--diff-filter=ACMR",
          `${ref}...HEAD`,
          "--",
        ]),
      ),
      ...(await getWorkingTreeFiles(root)),
      ...(await getUntrackedFiles(root)),
    ];
  }

  return new Set(
    [...new Set(relativeFiles)].map((filePath) => path.resolve(root, filePath)),
  );
};
