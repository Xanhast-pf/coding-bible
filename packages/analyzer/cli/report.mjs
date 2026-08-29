import { createHash } from "node:crypto";

const ruleBaseUrl = "https://xanhast-pf.github.io/coding-bible/#";

const normalizeFingerprintText = (value) => value.replace(/\s+/g, " ").trim();

export const createFindingFingerprint = (finding) => {
  const payload = [
    finding.ruleId,
    finding.detectorId,
    finding.filePath.replaceAll("\\", "/"),
    normalizeFingerprintText(finding.excerpt),
    normalizeFingerprintText(finding.message),
  ].join("\0");

  return createHash("sha256").update(payload).digest("hex").slice(0, 24);
};

const serializeFix = (fix, patchFiles) => {
  if (!fix) {
    return {
      available: false,
      safety: "none",
    };
  }

  return {
    available: Boolean(fix.edits?.length),
    description: fix.description,
    patch:
      fix.edits?.length && patchFiles
        ? fix.safety === "safe"
          ? patchFiles.safe
          : patchFiles.review
        : null,
    safety: fix.safety,
    title: fix.title,
  };
};

export const createAnalyzerReport = (result, { patchFiles = null } = {}) => ({
  schemaVersion: 1,
  scope: result.scope,
  summary: {
    baselineSuppressed: result.baseline?.suppressed ?? 0,
    cacheHits: result.cache?.hits ?? 0,
    cacheMisses: result.cache?.misses ?? 0,
    diagnostics: result.diagnostics.length,
    errors: result.errors,
    filesDiscovered: result.filesDiscovered,
    filesAnalyzed: result.filesScanned,
    findings: result.findings.length,
    rulesChecked: result.ruleIdsChecked.length,
    safeFixes: result.findings.filter(
      ({ fix }) => fix?.safety === "safe" && fix.edits?.length,
    ).length,
    reviewFixes: result.findings.filter(
      ({ fix }) => fix?.safety === "review" && fix.edits?.length,
    ).length,
    warnings: result.warnings,
  },
  baseline: result.baseline ?? null,
  cache: result.cache ?? null,
  project: {
    configPath: result.configPath,
    projectCount: result.projectCount,
    tsconfigPaths: result.tsconfigPaths,
  },
  diagnostics: result.diagnostics.map((diagnostic) => ({
    excerpt: diagnostic.excerpt,
    file: diagnostic.filePath.replaceAll("\\", "/"),
    location: diagnostic.location,
    message: diagnostic.message,
  })),
  findings: result.findings.map((finding) => ({
    detectorId: finding.detectorId,
    excerpt: finding.excerpt,
    file: finding.filePath.replaceAll("\\", "/"),
    fingerprint: createFindingFingerprint(finding),
    fix: serializeFix(finding.fix, patchFiles),
    location: finding.location,
    message: finding.message,
    ruleId: finding.ruleId,
    ruleUrl: `${ruleBaseUrl}${finding.ruleId}`,
    severity: finding.severity,
    suggestion: finding.suggestion,
  })),
  profile: result.profile ?? null,
});
