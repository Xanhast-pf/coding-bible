import type { AnalyzerDiagnostic } from "@coding-bible/analyzer";
import { rulePackLabels, rules } from "@coding-bible/rules";
import { type SyntheticEvent, useEffect, useState } from "react";

import {
  countBrowserFixes,
  createBrowserAnalyzerReport,
  createBrowserFindingFix,
  createBrowserFixPatch,
} from "../../analyzer/artifacts";
import { downloadTextArtifact } from "../../analyzer/downloadArtifact";
import type {
  BrowserAnalyzeResult,
  BrowserAnalyzerFinding,
  BrowserProjectFile,
} from "../../analyzer/types";
import styles from "./AnalyzeView.module.css";

const rulesById = new Map(rules.map((rule) => [rule.id, rule]));

const DiagnosticCard = ({
  diagnostic,
  fileName,
}: {
  diagnostic: AnalyzerDiagnostic;
  fileName: string;
}) => (
  <article className={`${styles.finding} ${styles.diagnostic}`}>
    <div className={styles.findingMeta}>
      <span className={styles.diagnosticLabel}>Syntax</span>
      <span className={styles.location}>
        {fileName} · {diagnostic.location.line}:{diagnostic.location.column}
      </span>
    </div>
    <h3 className={styles.findingTitle}>Fix syntax before rule analysis</h3>
    <p className={styles.message}>{diagnostic.message}</p>
    <pre className={styles.excerpt}>
      <code>
        <span aria-hidden="true" className={styles.excerptLineNumber}>
          {diagnostic.location.line}
        </span>
        <span>{diagnostic.excerpt}</span>
      </code>
    </pre>
    <p className={styles.suggestion}>
      Coding Bible pauses rule detectors on malformed syntax to avoid misleading
      findings.
    </p>
  </article>
);

const FindingCard = ({
  canApplySafeFix,
  fileName,
  finding,
  onApplySafeFix,
  source,
}: {
  canApplySafeFix: boolean;
  fileName: string;
  finding: BrowserAnalyzerFinding;
  onApplySafeFix?: (source: string) => void;
  source?: string;
}) => {
  const rule = rulesById.get(finding.ruleId);
  const fix = finding.fix;
  const [fixError, setFixError] = useState<string | null>(null);
  const [fixPatch, setFixPatch] = useState<string | null>(null);

  const prepareFix = () => {
    if (!fix?.edits?.length || source === undefined) {
      return null;
    }

    try {
      const prepared = createBrowserFindingFix(fileName, source, finding);
      setFixError(null);
      return prepared;
    } catch (error: unknown) {
      console.error("Could not prepare Coding Bible finding fix.", error);
      setFixError(
        error instanceof Error ? error.message : "Could not prepare this fix.",
      );
      return null;
    }
  };

  const handlePreviewToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    if (!event.currentTarget.open || fixPatch !== null) {
      return;
    }

    const prepared = prepareFix();
    if (prepared) {
      setFixPatch(prepared.patch);
    }
  };

  const handleApplySafeFix = () => {
    if (!canApplySafeFix || !onApplySafeFix) {
      return;
    }

    const prepared = prepareFix();
    if (prepared) {
      onApplySafeFix(prepared.source);
    }
  };

  return (
    <article className={styles.finding} data-level={rule?.level ?? "should"}>
      <div className={styles.findingMeta}>
        <a className={styles.ruleId} href={`./#${finding.ruleId}`}>
          {finding.ruleId}
        </a>
        <span className={styles.severity} data-severity={finding.severity}>
          {finding.severity}
        </span>
        {rule ? (
          <>
            <span className={styles.level}>{rule.level}</span>
            <span className={styles.pack}>{rulePackLabels[rule.pack]}</span>
          </>
        ) : null}
        <span className={styles.location}>
          {fileName} · {finding.location.line}:{finding.location.column}
        </span>
      </div>

      <h3 className={styles.findingTitle}>{rule?.title ?? finding.ruleId}</h3>
      <p className={styles.message}>{finding.message}</p>

      <pre className={styles.excerpt}>
        <code>
          <span aria-hidden="true" className={styles.excerptLineNumber}>
            {finding.location.line}
          </span>
          <span>{finding.excerpt}</span>
        </code>
      </pre>

      <p className={styles.suggestion}>{finding.suggestion}</p>

      {fix ? (
        <div className={styles.fixNotice} data-safety={fix.safety}>
          <div className={styles.fixHeading}>
            <span>{fix.safety === "safe" ? "Safe fix" : "Review fix"}</span>
            {fix.edits?.length ? (
              <span>
                {fix.edits.length} edit{fix.edits.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <strong>{fix.title}</strong>
          <p>{fix.description}</p>
          {fix.edits?.length && source !== undefined ? (
            <div className={styles.fixActions}>
              <details
                className={styles.fixPreview}
                onToggle={handlePreviewToggle}
              >
                <summary>Preview diff</summary>
                {fixError ? (
                  <p className={styles.fixError} role="alert">
                    {fixError}
                  </p>
                ) : fixPatch !== null ? (
                  <pre>
                    <code>{fixPatch}</code>
                  </pre>
                ) : (
                  <span>Preparing diff…</span>
                )}
              </details>
              {fix.safety === "safe" && canApplySafeFix ? (
                <button onClick={handleApplySafeFix} type="button">
                  Apply fix
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <a className={styles.viewRule} href={`./#${finding.ruleId}`}>
        View rule →
      </a>
    </article>
  );
};

interface AnalysisResultsProps {
  errorMessage: string | null;
  files: readonly BrowserProjectFile[];
  onApplySnippetFix?: (source: string) => void;
  projectName?: string;
  result: BrowserAnalyzeResult | null;
}

export const AnalysisResults = ({
  errorMessage,
  files,
  onApplySnippetFix,
  projectName,
  result,
}: AnalysisResultsProps) => {
  const [artifactError, setArtifactError] = useState<string | null>(null);

  useEffect(() => {
    setArtifactError(null);
  }, [result]);

  if (errorMessage) {
    return (
      <div className={styles.errorState} role="alert">
        <h3>Analyzer stopped.</h3>
        <p>{errorMessage}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.prompt}>&gt;_</span>
        <h3>Ready when you are.</h3>
        <p>
          Analyze a snippet or local project. Heavy compiler work runs off the
          main UI thread.
        </p>
      </div>
    );
  }

  const diagnostics = result.files.flatMap(({ fileName, result: fileResult }) =>
    fileResult.diagnostics.map((diagnostic) => ({ diagnostic, fileName })),
  );
  const findings = result.files.flatMap(({ fileName, result: fileResult }) =>
    fileResult.findings.map((finding) => ({ fileName, finding })),
  );
  const sources = new Map(files.map((file) => [file.fileName, file.source]));
  const checksRun = result.files.reduce(
    (total, { result: fileResult }) => total + fileResult.checksRun,
    0,
  );
  const ruleIdsChecked = new Set(
    result.files.flatMap(({ result: fileResult }) => fileResult.ruleIdsChecked),
  );
  const errorCount = findings.filter(
    ({ finding }) => finding.severity === "error",
  ).length;
  const warningCount = findings.length - errorCount;
  const safeFixCount = countBrowserFixes(result, "safe");
  const reviewFixCount = countBrowserFixes(result, "review");
  const issueCount = diagnostics.length + findings.length;
  const issueLabel =
    diagnostics.length && findings.length
      ? " issues"
      : diagnostics.length
        ? diagnostics.length === 1
          ? " syntax issue"
          : " syntax issues"
        : findings.length === 1
          ? " finding"
          : " findings";
  const elapsed =
    result.durationMs < 1_000
      ? `${Math.round(result.durationMs)} ms`
      : `${(result.durationMs / 1_000).toFixed(1)} s`;

  const downloadReport = () => {
    setArtifactError(null);

    try {
      const report = createBrowserAnalyzerReport(
        result,
        projectName ? { projectName } : {},
      );
      downloadTextArtifact(
        "coding-bible-report.json",
        `${JSON.stringify(report, null, 2)}\n`,
        "application/json",
      );
    } catch (error: unknown) {
      console.error("Could not create Coding Bible browser report.", error);
      setArtifactError(
        error instanceof Error
          ? error.message
          : "Could not create the analyzer report.",
      );
    }
  };

  const downloadPatch = (safety: "safe" | "review") => {
    setArtifactError(null);

    try {
      const patch = createBrowserFixPatch(result, files, safety);
      if (!patch.patch) {
        throw new Error(`No ${safety} fixes are available for this result.`);
      }

      downloadTextArtifact(
        safety === "safe" ? "safe-fixes.patch" : "review-fixes.patch",
        patch.patch,
        "text/x-diff",
      );
    } catch (error: unknown) {
      console.error(`Could not create Coding Bible ${safety} patch.`, error);
      setArtifactError(
        error instanceof Error
          ? error.message
          : `Could not create the ${safety} fix patch.`,
      );
    }
  };

  return (
    <>
      <div className={styles.resultSummary}>
        <div>
          <strong>{issueCount}</strong>
          <span>{issueLabel}</span>
        </div>
        <span>
          {result.sourceFileCount} files · {ruleIdsChecked.size} rules ·{" "}
          {elapsed}
          {result.configFileName ? ` · ${result.configFileName}` : ""}
        </span>
      </div>

      <div className={styles.artifactBar}>
        <div>
          <strong>Export analysis</strong>
          <span>Report and detector-authored patches stay local.</span>
        </div>
        <div className={styles.artifactButtons}>
          <button onClick={downloadReport} type="button">
            Report JSON
          </button>
          {safeFixCount ? (
            <button onClick={() => downloadPatch("safe")} type="button">
              Safe patch · {safeFixCount}
            </button>
          ) : null}
          {reviewFixCount ? (
            <button
              className={styles.reviewPatchButton}
              onClick={() => downloadPatch("review")}
              type="button"
            >
              Review patch · {reviewFixCount}
            </button>
          ) : null}
        </div>
      </div>

      {artifactError ? (
        <div className={styles.artifactError} role="alert">
          {artifactError}
        </div>
      ) : null}

      {safeFixCount || reviewFixCount ? (
        <div className={styles.fixSummary}>
          {safeFixCount ? (
            <span>
              {safeFixCount} mechanically safe{" "}
              {safeFixCount === 1 ? "fix" : "fixes"}
            </span>
          ) : null}
          {reviewFixCount ? (
            <span>
              {reviewFixCount}{" "}
              {reviewFixCount === 1 ? "fix needs" : "fixes need"} review
            </span>
          ) : null}
        </div>
      ) : null}

      {findings.length ? (
        <div className={styles.severitySummary}>
          <span>{errorCount} errors</span>
          <span>{warningCount} warnings</span>
          {diagnostics.length ? <span>{diagnostics.length} syntax</span> : null}
        </div>
      ) : null}

      {result.configurationDiagnostics.length ? (
        <div className={styles.configWarnings} role="status">
          <strong>Project configuration</strong>
          <ul>
            {result.configurationDiagnostics.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {issueCount ? (
        <div className={styles.findings}>
          {diagnostics.map(({ diagnostic, fileName }) => (
            <DiagnosticCard
              diagnostic={diagnostic}
              fileName={fileName}
              key={[
                fileName,
                diagnostic.location.line,
                diagnostic.location.column,
                diagnostic.message,
              ].join("-")}
            />
          ))}
          {findings.map(({ fileName, finding }) => {
            const source = sources.get(fileName);

            return (
              <FindingCard
                canApplySafeFix={
                  result.mode === "snippet" && Boolean(onApplySnippetFix)
                }
                fileName={fileName}
                finding={finding}
                key={[
                  fileName,
                  finding.detectorId,
                  finding.location.line,
                  finding.location.column,
                ].join("-")}
                {...(onApplySnippetFix
                  ? { onApplySafeFix: onApplySnippetFix }
                  : {})}
                {...(source === undefined ? {} : { source })}
              />
            );
          })}
        </div>
      ) : (
        <div className={styles.cleanState}>
          <h3>No supported violations found.</h3>
          <p>
            Clean for {ruleIdsChecked.size} applicable automated rules across{" "}
            {result.sourceFileCount} source
            {result.sourceFileCount === 1 ? " file" : " files"}. The remaining{" "}
            {rules.length - ruleIdsChecked.size} rules still require review.
          </p>
          <p className={styles.cleanMeta}>
            {checksRun} detector runs completed.
          </p>
        </div>
      )}
    </>
  );
};
