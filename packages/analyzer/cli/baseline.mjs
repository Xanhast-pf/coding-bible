import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createFindingFingerprint } from "./report.mjs";

const baselineSchemaVersion = 1;
const defaultBaselineFile = ".coding-bible-baseline.json";

const normalizePath = (value) => value.replaceAll("\\", "/");

export const resolveBaselinePath = (
  rootDir,
  config,
  { enabled = true, overridePath } = {},
) => {
  if (!enabled) {
    return null;
  }
  if (overridePath) {
    return path.resolve(rootDir, overridePath);
  }
  if (config.baseline === false) {
    return null;
  }
  const configuredPath = config.baseline ?? defaultBaselineFile;
  return path.resolve(rootDir, configuredPath);
};

export const loadBaseline = async (filePath) => {
  if (!filePath) {
    return null;
  }
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf8"));
    if (
      parsed?.schemaVersion !== baselineSchemaVersion ||
      !Array.isArray(parsed.findings)
    ) {
      throw new Error(
        `Unsupported Coding Bible baseline schema in ${filePath}.`,
      );
    }
    for (const finding of parsed.findings) {
      if (
        !finding ||
        typeof finding.fingerprint !== "string" ||
        typeof finding.ruleId !== "string" ||
        typeof finding.file !== "string"
      ) {
        throw new Error(`Invalid Coding Bible baseline entry in ${filePath}.`);
      }
    }
    return parsed;
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
};

export const applyBaseline = (findings, baseline) => {
  if (!baseline) {
    return { findings, suppressedFindings: [] };
  }
  const known = new Set(
    baseline.findings.map(({ fingerprint }) => fingerprint),
  );
  const active = [];
  const suppressed = [];
  for (const finding of findings) {
    if (known.has(createFindingFingerprint(finding))) {
      suppressed.push(finding);
    } else {
      active.push(finding);
    }
  }
  return { findings: active, suppressedFindings: suppressed };
};

export const writeBaseline = async (result, filePath) => {
  const entries = result.findings
    .map((finding) => ({
      file: normalizePath(finding.filePath),
      fingerprint: createFindingFingerprint(finding),
      ruleId: finding.ruleId,
    }))
    .sort(
      (left, right) =>
        left.file.localeCompare(right.file) ||
        left.ruleId.localeCompare(right.ruleId) ||
        left.fingerprint.localeCompare(right.fingerprint),
    );
  const uniqueEntries = [
    ...new Map(entries.map((entry) => [entry.fingerprint, entry])).values(),
  ];
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    `${JSON.stringify(
      {
        schemaVersion: baselineSchemaVersion,
        generatedAt: new Date().toISOString(),
        findings: uniqueEntries,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  return uniqueEntries.length;
};
