import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { analyzeMany } from "../src/index.ts";

const languageByExtension = new Map([
  [".js", "js"],
  [".jsx", "jsx"],
  [".ts", "ts"],
  [".tsx", "tsx"],
]);

const ignoredDirectoryNames = new Set([
  ".git",
  ".next",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
]);

const normalizeTargets = (targets) => (targets.length ? targets : ["."]);

const toRelativePath = (cwd, filePath) => {
  const relativePath = path.relative(cwd, filePath);
  return relativePath || path.basename(filePath);
};

const isSupportedFile = (filePath) => languageByExtension.has(path.extname(filePath));

const collectFromDirectory = async (directoryPath, files) => {
  const entries = await readdir(directoryPath, { withFileTypes: true });

  entries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      continue;
    }

    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectoryNames.has(entry.name)) {
        await collectFromDirectory(entryPath, files);
      }
      continue;
    }

    if (entry.isFile() && isSupportedFile(entryPath)) {
      files.push(entryPath);
    }
  }
};

export const collectSourceFiles = async (targets, { cwd = process.cwd() } = {}) => {
  const files = [];

  for (const target of normalizeTargets(targets)) {
    const targetPath = path.resolve(cwd, target);
    const targetStat = await stat(targetPath);

    if (targetStat.isDirectory()) {
      await collectFromDirectory(targetPath, files);
      continue;
    }

    if (targetStat.isFile() && isSupportedFile(targetPath)) {
      files.push(targetPath);
    }
  }

  return [...new Set(files)].sort((left, right) => left.localeCompare(right));
};

export const checkPaths = async (targets, { cwd = process.cwd() } = {}) => {
  const filePaths = await collectSourceFiles(targets, { cwd });
  const inputs = await Promise.all(
    filePaths.map(async (filePath) => {
      const language = languageByExtension.get(path.extname(filePath));
      if (!language) {
        return null;
      }

      return {
        fileName: toRelativePath(cwd, filePath),
        language,
        source: await readFile(filePath, "utf8"),
      };
    }),
  );
  const supportedInputs = inputs.filter(Boolean);
  const results = analyzeMany(supportedInputs);
  const findings = [];
  const diagnostics = [];
  const ruleIdsChecked = new Set();
  let checksRun = 0;

  results.forEach((result, index) => {
    const input = supportedInputs[index];
    if (!input) {
      return;
    }

    checksRun += result.checksRun;
    result.ruleIdsChecked.forEach((ruleId) => ruleIdsChecked.add(ruleId));

    for (const diagnostic of result.diagnostics) {
      diagnostics.push({ ...diagnostic, filePath: input.fileName });
    }

    for (const finding of result.findings) {
      findings.push({ ...finding, filePath: input.fileName });
    }
  });

  const byLocation = (left, right) =>
    left.filePath.localeCompare(right.filePath) ||
    left.location.line - right.location.line ||
    left.location.column - right.location.column;

  findings.sort(
    (left, right) => byLocation(left, right) || left.ruleId.localeCompare(right.ruleId),
  );
  diagnostics.sort(byLocation);

  return {
    checksRun,
    diagnostics,
    filesScanned: supportedInputs.length,
    findings,
    ruleIdsChecked: [...ruleIdsChecked].sort(),
  };
};
