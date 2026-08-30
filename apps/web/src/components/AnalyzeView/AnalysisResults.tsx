import type {
  AnalyzerDiagnostic,
  AnalyzerFinding,
} from "@coding-bible/analyzer";
import { rulePackLabels, rules } from "@coding-bible/rules";

import type { BrowserAnalyzeResult } from "../../analyzer/types";
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
  fileName,
  finding,
}: {
  fileName: string;
  finding: AnalyzerFinding;
}) => {
  const rule = rulesById.get(finding.ruleId);

  return (
    <article className={styles.finding} data-level={rule?.level ?? "should"}>
      <div className={styles.findingMeta}>
        <a className={styles.ruleId} href={`./#${finding.ruleId}`}>
          {finding.ruleId}
        </a>
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
      <a className={styles.viewRule} href={`./#${finding.ruleId}`}>
        View rule →
      </a>
    </article>
  );
};

interface AnalysisResultsProps {
  errorMessage: string | null;
  result: BrowserAnalyzeResult | null;
}

export const AnalysisResults = ({
  errorMessage,
  result,
}: AnalysisResultsProps) => {
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
  const checksRun = result.files.reduce(
    (total, { result: fileResult }) => total + fileResult.checksRun,
    0,
  );
  const ruleIdsChecked = new Set(
    result.files.flatMap(({ result: fileResult }) => fileResult.ruleIdsChecked),
  );
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
        </span>
      </div>

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
          {findings.map(({ fileName, finding }) => (
            <FindingCard
              fileName={fileName}
              finding={finding}
              key={[
                fileName,
                finding.detectorId,
                finding.location.line,
                finding.location.column,
              ].join("-")}
            />
          ))}
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
