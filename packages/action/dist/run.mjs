import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { checkPaths } from "./analyzerBridge.mjs";
import {
  canonicalBaseUrl,
  defaultSarifPath,
  maximumAnnotations,
} from "./constants.mjs";
import { filterChangedLocations, parseGitDiff } from "./diff.mjs";
import { getChangedDiff, resolveBaseRef } from "./git.mjs";
import { writeCommand, writeOutput, writeSummary } from "./github.mjs";
import { readActionInputs } from "./inputs.mjs";
import { createRuleMap } from "./ruleCatalog.mjs";
import { createSarif } from "./sarif.mjs";

const isInside = (parent, candidate) => {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

const resolveTarget = (cwd, requestedPath) => {
  const absolute = path.resolve(cwd, requestedPath);
  if (!isInside(cwd, absolute)) {
    throw new Error(
      `path must stay inside the checked-out repository: ${requestedPath}`,
    );
  }
  const relative = path.relative(cwd, absolute);
  return relative || ".";
};

const markdownEscape = (value) =>
  String(value).replaceAll("|", "\\|").replaceAll("\n", " ");

const createEmptyAnalysis = () => ({
  baseline: null,
  diagnostics: [],
  errors: 0,
  filesDiscovered: 0,
  filesScanned: 0,
  findings: [],
  ruleIdsChecked: [],
  warnings: 0,
});

const shouldFail = ({ failOn, errors, warnings, diagnostics }) => {
  if (failOn === "none") {
    return false;
  }
  if (diagnostics > 0 || errors > 0) {
    return true;
  }
  return failOn === "warning" && warnings > 0;
};

const createSummary = ({
  analysis,
  baseRef,
  diagnostics,
  errors,
  findings,
  inputs,
  rulesById,
  sarifPath,
  warnings,
}) => {
  const lines = [
    "## Coding Bible",
    "",
    `**Result:** ${shouldFail({ failOn: inputs.failOn, errors, warnings, diagnostics: diagnostics.length }) ? "❌ Failed" : "✅ Passed"}`,
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| Files analyzed | ${analysis.filesScanned ?? 0} |`,
    `| Deterministic rules checked | ${analysis.ruleIdsChecked?.length ?? 0} |`,
    `| Errors | ${errors} |`,
    `| Warnings | ${warnings} |`,
    `| Syntax diagnostics | ${diagnostics.length} |`,
    `| Baseline-suppressed findings | ${analysis.baseline?.suppressed ?? 0} |`,
    "",
    `Scope: \`${inputs.scope}\`${baseRef ? ` from \`${markdownEscape(baseRef)}\`` : ""}. Fail policy: \`${inputs.failOn}\`.`,
    "",
    "Coding Bible reports only implemented deterministic analyzer coverage. A clean run does **not** claim that semantic/review-only rules were automatically verified.",
  ];

  if (findings.length) {
    lines.push(
      "",
      "### Findings",
      "",
      "| Severity | Rule | Location | Message |",
      "| --- | --- | --- | --- |",
    );
    for (const finding of findings.slice(0, 25)) {
      const rule = rulesById.get(finding.ruleId);
      const url = `${canonicalBaseUrl}#${finding.ruleId}`;
      lines.push(
        `| ${finding.severity} | [${markdownEscape(finding.ruleId)}](${url})${rule?.title ? ` · ${markdownEscape(rule.title)}` : ""} | \`${markdownEscape(finding.filePath)}:${finding.location.line}\` | ${markdownEscape(finding.message)} |`,
      );
    }
    if (findings.length > 25) {
      lines.push(
        "",
        `_${findings.length - 25} additional findings are available in the log/SARIF output._`,
      );
    }
  }

  if (diagnostics.length) {
    lines.push("", "### Syntax diagnostics", "");
    for (const diagnostic of diagnostics.slice(0, 10)) {
      lines.push(
        `- \`${markdownEscape(diagnostic.filePath)}:${diagnostic.location.line}\` — ${markdownEscape(diagnostic.message)}`,
      );
    }
  }

  if (sarifPath) {
    lines.push("", `SARIF: \`${markdownEscape(sarifPath)}\``);
  }

  return lines.join("\n");
};

const emitAnnotations = ({ diagnostics, findings, rulesById, stream }) => {
  let emitted = 0;
  for (const finding of findings) {
    if (emitted >= maximumAnnotations) {
      break;
    }
    const rule = rulesById.get(finding.ruleId);
    writeCommand(
      stream,
      finding.severity === "error" ? "error" : "warning",
      {
        file: finding.filePath,
        line: finding.location.line,
        col: finding.location.column,
        endLine: finding.location.endLine,
        endColumn: finding.location.endColumn,
        title: `${finding.ruleId}${rule?.title ? ` · ${rule.title}` : ""}`,
      },
      `${finding.message} ${finding.suggestion} ${canonicalBaseUrl}#${finding.ruleId}`,
    );
    emitted += 1;
  }

  for (const diagnostic of diagnostics) {
    if (emitted >= maximumAnnotations) {
      break;
    }
    writeCommand(
      stream,
      "error",
      {
        file: diagnostic.filePath,
        line: diagnostic.location.line,
        col: diagnostic.location.column,
        endLine: diagnostic.location.endLine,
        endColumn: diagnostic.location.endColumn,
        title: "Coding Bible · Syntax diagnostic",
      },
      diagnostic.message,
    );
    emitted += 1;
  }

  if (findings.length + diagnostics.length > emitted) {
    writeCommand(
      stream,
      "notice",
      { title: "Coding Bible" },
      `${findings.length + diagnostics.length - emitted} additional annotations were omitted from the log. See the Step Summary and SARIF output.`,
    );
  }
};

export const runAction = async ({
  cwd = process.env.GITHUB_WORKSPACE || process.cwd(),
  environment = process.env,
  stream = process.stdout,
} = {}) => {
  const inputs = readActionInputs(environment);
  const targetPath = resolveTarget(cwd, inputs.path);
  const configPath = inputs.configPath
    ? resolveTarget(cwd, inputs.configPath)
    : null;
  const rulesById = await createRuleMap();
  let analysis;
  let baseRef = null;
  let changes = null;

  if (inputs.scope === "changed") {
    baseRef = await resolveBaseRef({ baseRef: inputs.baseRef, environment });
    const diff = await getChangedDiff({ cwd, baseRef, targetPath });
    changes = parseGitDiff(diff).filter(({ ranges }) => ranges.length > 0);
    const changedFiles = changes.map(({ file }) => file);

    analysis = changedFiles.length
      ? await checkPaths(changedFiles, {
          cwd,
          baseline: inputs.baseline,
          cache: false,
          ...(configPath ? { configPath } : {}),
        })
      : createEmptyAnalysis();
  } else {
    analysis = await checkPaths([targetPath], {
      cwd,
      baseline: inputs.baseline,
      cache: false,
      ...(configPath ? { configPath } : {}),
    });
  }

  const findings = changes
    ? filterChangedLocations(analysis.findings, changes)
    : analysis.findings;
  const diagnostics = changes
    ? filterChangedLocations(analysis.diagnostics, changes)
    : analysis.diagnostics;
  const errors = findings.filter(({ severity }) => severity === "error").length;
  const warnings = findings.length - errors;
  const failed = shouldFail({
    failOn: inputs.failOn,
    errors,
    warnings,
    diagnostics: diagnostics.length,
  });

  if (inputs.annotations) {
    emitAnnotations({ diagnostics, findings, rulesById, stream });
  }

  let sarifPath = null;
  if (inputs.sarif) {
    sarifPath = defaultSarifPath;
    const absoluteSarifPath = path.join(cwd, sarifPath);
    await mkdir(path.dirname(absoluteSarifPath), { recursive: true });
    const sarif = createSarif({ diagnostics, findings, rulesById });
    await writeFile(
      absoluteSarifPath,
      `${JSON.stringify(sarif, null, 2)}\n`,
      "utf8",
    );
  }

  const outputs = {
    conclusion: failed ? "failed" : "passed",
    diagnostics: diagnostics.length,
    errors,
    findings: findings.length,
    "files-analyzed": analysis.filesScanned ?? 0,
    "rules-checked": analysis.ruleIdsChecked?.length ?? 0,
    "sarif-path": sarifPath ?? "",
    warnings,
  };
  for (const [name, value] of Object.entries(outputs)) {
    await writeOutput(environment, name, value);
  }

  await writeSummary(
    environment,
    createSummary({
      analysis,
      baseRef,
      diagnostics,
      errors,
      findings,
      inputs,
      rulesById,
      sarifPath,
      warnings,
    }),
  );

  stream.write(
    `Coding Bible: ${findings.length} finding(s), ${diagnostics.length} syntax diagnostic(s), ${analysis.filesScanned ?? 0} file(s) analyzed.\n`,
  );

  return { failed, outputs };
};
