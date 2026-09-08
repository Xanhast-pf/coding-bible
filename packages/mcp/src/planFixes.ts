import { checkFiles, type CheckFilesInput } from "./checkFiles.ts";
import { codingBibleCanonicalUrl } from "./constants.ts";

export type PlanFixesInput = CheckFilesInput;
export type FixPriority = "P0" | "P1" | "P2" | "P3";

const severityWeight = { error: 4, warning: 0 } as const;
const impactWeight = { high: 4, medium: 2, low: 0 } as const;
const confidenceWeight = { certain: 2, strong: 1, contextual: 0 } as const;

const priorityOf = (finding: {
  severity: "error" | "warning";
  impact: "high" | "medium" | "low";
  confidence: "certain" | "strong" | "contextual";
}): FixPriority => {
  const score =
    severityWeight[finding.severity] +
    impactWeight[finding.impact] +
    confidenceWeight[finding.confidence];
  if (score >= 9) return "P0";
  if (score >= 6) return "P1";
  if (score >= 3) return "P2";
  return "P3";
};

export const planFixes = async (
  input: PlanFixesInput,
  {
    canonicalBaseUrl = codingBibleCanonicalUrl,
    rootDirectory = process.cwd(),
    signal,
  }: {
    canonicalBaseUrl?: string;
    rootDirectory?: string;
    signal?: AbortSignal;
  } = {},
) => {
  const checked = await checkFiles(input, {
    canonicalBaseUrl,
    rootDirectory,
    ...(signal ? { signal } : {}),
  });
  const reviewOrder: Array<
    (typeof checked.analyzer.findings)[number] & { priority: FixPriority }
  > = [...checked.analyzer.findings]
    .map((finding) => ({ ...finding, priority: priorityOf(finding) }))
    .sort(
      (left, right) =>
        left.priority.localeCompare(right.priority) ||
        left.file.localeCompare(right.file) ||
        left.location.line - right.location.line ||
        left.location.column - right.location.column ||
        left.ruleId.localeCompare(right.ruleId),
    );
  const priorities: Record<FixPriority, number> = {
    P0: 0,
    P1: 0,
    P2: 0,
    P3: 0,
  };
  for (const finding of reviewOrder) priorities[finding.priority] += 1;

  const briefLines = [
    "# Coding Bible Review Brief",
    "",
    `- Files analyzed: **${checked.analyzer.summary.filesAnalyzed}**`,
    `- Applicable automated rules: **${checked.analyzer.summary.rulesChecked}**`,
    `- Active findings: **${checked.analyzer.summary.findings}**`,
    `- Baseline suppressed: **${checked.analyzer.summary.baselineSuppressed}**`,
    `- Safe fixes: **${checked.analyzer.summary.safeFixes}**`,
    `- Review fixes: **${checked.analyzer.summary.reviewFixes}**`,
    "",
    "## Review order",
    "",
    ...reviewOrder.map(
      (finding) =>
        `- **${finding.priority} · ${finding.ruleId} · ${finding.severity.toUpperCase()}** — ` +
        `${finding.file}:${finding.location.line}:${finding.location.column} — ${finding.message}`,
    ),
  ];
  if (!reviewOrder.length) briefLines.push("No active findings.");

  return {
    schemaVersion: 1 as const,
    kind: "fix-plan" as const,
    root: checked.root,
    targets: checked.targets,
    fixPack: {
      formatVersion: 1 as const,
      summary: {
        baselineSuppressed: checked.analyzer.summary.baselineSuppressed,
        diagnostics: checked.analyzer.summary.diagnostics,
        filesAnalyzed: checked.analyzer.summary.filesAnalyzed,
        findings: checked.analyzer.summary.findings,
        priorities,
        reviewFixes: checked.analyzer.summary.reviewFixes,
        safeFixes: checked.analyzer.summary.safeFixes,
      },
      reviewOrder,
    },
    reviewBrief: `${briefLines.join("\n")}\n`,
    ruleReferences: checked.ruleReferences,
    coverageNote: checked.coverageNote,
  };
};
