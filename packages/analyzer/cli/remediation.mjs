import { createFindingFingerprint } from "./report.mjs";

const severityWeight = { error: 4, warning: 0 };
const impactWeight = { high: 4, medium: 2, low: 0 };
const confidenceWeight = { certain: 2, strong: 1, contextual: 0 };

const getFindingPriority = (finding) => {
  const score =
    (severityWeight[finding.severity] ?? 0) +
    (impactWeight[finding.impact] ?? 0) +
    (confidenceWeight[finding.confidence] ?? 0);
  if (score >= 9) return "P0";
  if (score >= 6) return "P1";
  if (score >= 3) return "P2";
  return "P3";
};

const compareFindings = (left, right) =>
  getFindingPriority(left).localeCompare(getFindingPriority(right)) ||
  left.filePath.localeCompare(right.filePath) ||
  left.location.line - right.location.line ||
  left.location.column - right.location.column ||
  left.ruleId.localeCompare(right.ruleId);

const serializePlanFinding = (finding) => ({
  confidence: finding.confidence,
  contextNote: finding.contextNote ?? null,
  file: finding.filePath.replaceAll("\\", "/"),
  fingerprint: createFindingFingerprint(finding),
  fix: finding.fix?.edits?.length
    ? { available: true, safety: finding.fix.safety, title: finding.fix.title }
    : { available: false, safety: "none" },
  impact: finding.impact,
  location: finding.location,
  message: finding.message,
  priority: getFindingPriority(finding),
  ruleId: finding.ruleId,
  severity: finding.severity,
  suggestion: finding.suggestion,
});

export const createFixPack = (
  result,
  { reviewPatchPath = null, safePatchPath = null } = {},
) => {
  const ordered = [...result.findings].sort(compareFindings);
  const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const finding of ordered) counts[getFindingPriority(finding)] += 1;

  return {
    formatVersion: 1,
    scope: result.scope,
    summary: {
      baselineSuppressed: result.baseline?.suppressed ?? 0,
      diagnostics: result.diagnostics.length,
      filesAnalyzed: result.filesScanned,
      findings: ordered.length,
      priorities: counts,
      reviewFixes: ordered.filter(
        ({ fix }) => fix?.safety === "review" && fix.edits?.length,
      ).length,
      safeFixes: ordered.filter(
        ({ fix }) => fix?.safety === "safe" && fix.edits?.length,
      ).length,
    },
    baseline: result.baseline ?? null,
    patches: { review: reviewPatchPath, safe: safePatchPath },
    reviewOrder: ordered.map(serializePlanFinding),
  };
};

const scopeLabel = (scope) =>
  scope.mode === "since" ? `since ${scope.ref}` : scope.mode;

export const createReviewBrief = (result, fixPack) => {
  const baseline = result.baseline;
  const lines = [
    "# Coding Bible Review Brief",
    "",
    `- Scope: **${scopeLabel(result.scope)}**`,
    `- Files analyzed: **${result.filesScanned}**`,
    `- Applicable automated rules: **${result.ruleIdsChecked.length}**`,
    `- Active findings: **${result.findings.length}**`,
    `- Baseline suppressed: **${baseline?.suppressed ?? 0}**`,
    `- Safe fixes: **${fixPack.summary.safeFixes}**`,
    `- Review fixes: **${fixPack.summary.reviewFixes}**`,
  ];

  if (baseline) {
    lines.push(`- Baseline entries: **${baseline.entries}**`);
    if (baseline.generatedAt)
      lines.push(`- Baseline generated: **${baseline.generatedAt}**`);
  }

  lines.push("", "## Review order", "");
  if (!fixPack.reviewOrder.length) {
    lines.push("No active findings.");
  } else {
    for (const finding of fixPack.reviewOrder) {
      lines.push(
        `- **${finding.priority} · ${finding.ruleId} · ${finding.severity.toUpperCase()}** — ` +
          `${finding.file}:${finding.location.line}:${finding.location.column} — ${finding.message}`,
      );
      if (finding.contextNote)
        lines.push(`  - Context: ${finding.contextNote}`);
      if (finding.fix.available)
        lines.push(`  - Fix: ${finding.fix.safety} — ${finding.fix.title}`);
    }
  }

  return `${lines.join("\n")}\n`;
};
