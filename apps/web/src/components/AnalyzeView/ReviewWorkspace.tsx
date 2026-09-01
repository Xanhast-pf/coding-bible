import { rulePackLabels, rules } from "@coding-bible/rules";
import { useEffect, useMemo, useState } from "react";

import {
  createBrowserReviewComparison,
  type BrowserReviewComparison,
} from "../../analyzer/review";
import type {
  BrowserAnalyzeResult,
  BrowserAnalyzerFinding,
  BrowserProjectFile,
} from "../../analyzer/types";
import styles from "./AnalyzeView.module.css";
import { ReviewCodePane } from "./ReviewCodePane";
import { ReviewGuidancePane } from "./ReviewGuidancePane";

const rulesById = new Map(rules.map((rule) => [rule.id, rule]));

interface ReviewWorkspaceProps {
  files: readonly BrowserProjectFile[];
  onApplySnippetFix?: (source: string) => void;
  result: BrowserAnalyzeResult;
}

interface ReviewFile {
  fileName: string;
  findings: readonly BrowserAnalyzerFinding[];
  source: string;
}

const findingKey = (finding: BrowserAnalyzerFinding) =>
  [
    finding.detectorId,
    finding.ruleId,
    finding.location.line,
    finding.location.column,
    finding.location.endLine,
    finding.location.endColumn,
    finding.message,
  ].join(":");

export const ReviewWorkspace = ({
  files,
  onApplySnippetFix,
  result,
}: ReviewWorkspaceProps) => {
  const reviewFiles = useMemo<readonly ReviewFile[]>(() => {
    const sources = new Map(files.map((file) => [file.fileName, file.source]));

    return result.files.flatMap(({ fileName, result: fileResult }) => {
      const source = sources.get(fileName);
      return source !== undefined && fileResult.findings.length
        ? [{ fileName, findings: fileResult.findings, source }]
        : [];
    });
  }, [files, result]);
  const [activeFileName, setActiveFileName] = useState(
    () => reviewFiles[0]?.fileName ?? "",
  );
  const [activeFindingIndex, setActiveFindingIndex] = useState(0);

  useEffect(() => {
    setActiveFileName(reviewFiles[0]?.fileName ?? "");
    setActiveFindingIndex(0);
  }, [result, reviewFiles]);

  if (!reviewFiles.length) {
    return null;
  }

  const activeFile =
    reviewFiles.find(({ fileName }) => fileName === activeFileName) ??
    reviewFiles[0];
  const activeFinding = activeFile?.findings[activeFindingIndex];

  if (!activeFile || !activeFinding) {
    return null;
  }

  const rule = rulesById.get(activeFinding.ruleId);
  const fix = activeFinding.fix;
  const hasStructuredFix = Boolean(fix?.edits?.length);
  let comparison: BrowserReviewComparison | undefined;
  let comparisonError: string | null = null;

  try {
    comparison = createBrowserReviewComparison(
      activeFile.fileName,
      activeFile.source,
      activeFinding,
    );
  } catch (error: unknown) {
    console.error("Could not prepare Coding Bible review comparison.", error);
    comparisonError =
      error instanceof Error
        ? error.message
        : "Could not prepare this review comparison.";
  }

  const findingCount = reviewFiles.reduce(
    (total, file) => total + file.findings.length,
    0,
  );
  const fileFixCount = (file: ReviewFile) =>
    file.findings.filter((finding) => finding.fix?.edits?.length).length;
  const canApplySafeFix =
    result.mode === "snippet" &&
    fix?.safety === "safe" &&
    hasStructuredFix &&
    Boolean(onApplySnippetFix) &&
    Boolean(comparison);

  const selectFile = (fileName: string) => {
    setActiveFileName(fileName);
    setActiveFindingIndex(0);
  };

  return (
    <section
      aria-labelledby="analyzer-review-heading"
      className={styles.reviewWorkspace}
      id="analyzer-review"
    >
      <header className={styles.reviewWorkspaceHeader}>
        <div>
          <p className={styles.kicker}>Code review</p>
          <h3 id="analyzer-review-heading">Review analyzer suggestions.</h3>
        </div>
        <span>
          {reviewFiles.length} {reviewFiles.length === 1 ? "file" : "files"} ·{" "}
          {findingCount} {findingCount === 1 ? "finding" : "findings"}
        </span>
      </header>

      <div className={styles.reviewLayout}>
        <nav
          aria-label="Files with analyzer findings"
          className={styles.reviewNav}
        >
          <div className={styles.reviewNavHeader}>
            <strong>Files</strong>
            <span>{reviewFiles.length}</span>
          </div>
          <div className={styles.reviewFileList}>
            {reviewFiles.map((file) => {
              const selected = file.fileName === activeFile.fileName;
              const fixCount = fileFixCount(file);

              return (
                <div className={styles.reviewFileGroup} key={file.fileName}>
                  <button
                    aria-current={selected ? "true" : undefined}
                    className={styles.reviewFileButton}
                    onClick={() => selectFile(file.fileName)}
                    type="button"
                  >
                    <span>{file.fileName}</span>
                    <small>
                      {file.findings.length} issue
                      {file.findings.length === 1 ? "" : "s"}
                      {fixCount
                        ? ` · ${fixCount} fix${fixCount === 1 ? "" : "es"}`
                        : ""}
                    </small>
                  </button>

                  {selected ? (
                    <div className={styles.reviewFindingList}>
                      {file.findings.map((finding, index) => (
                        <button
                          aria-current={
                            index === activeFindingIndex ? "true" : undefined
                          }
                          className={styles.reviewFindingButton}
                          key={findingKey(finding)}
                          onClick={() => setActiveFindingIndex(index)}
                          type="button"
                        >
                          <span>
                            {finding.ruleId} · L{finding.location.line}
                          </span>
                          <small>{finding.message}</small>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </nav>

        <div className={styles.reviewMain}>
          <header className={styles.reviewFindingHeader}>
            <div>
              <div className={styles.reviewFindingMeta}>
                <a href={`./#${activeFinding.ruleId}`}>
                  {activeFinding.ruleId}
                </a>
                <span data-severity={activeFinding.severity}>
                  {activeFinding.severity}
                </span>
                <span data-impact={activeFinding.impact}>
                  {activeFinding.impact} impact
                </span>
                <span data-confidence={activeFinding.confidence}>
                  {activeFinding.confidence} confidence
                </span>
                {rule ? <span>{rulePackLabels[rule.pack]}</span> : null}
                {fix ? (
                  <span data-safety={fix.safety}>
                    {fix.safety === "safe" ? "safe fix" : "review fix"}
                  </span>
                ) : (
                  <span>review only</span>
                )}
              </div>
              <h4>{rule?.title ?? activeFinding.ruleId}</h4>
            </div>
            <div className={styles.reviewFindingActions}>
              <span>
                {activeFile.fileName} · {activeFinding.location.line}:
                {activeFinding.location.column}
              </span>
              {canApplySafeFix && comparison && onApplySnippetFix ? (
                <button
                  onClick={() => onApplySnippetFix(comparison.proposedSource)}
                  type="button"
                >
                  Apply safe fix
                </button>
              ) : null}
            </div>
          </header>

          {comparisonError ? (
            <div className={styles.reviewError} role="alert">
              {comparisonError}
            </div>
          ) : comparison ? (
            <div className={styles.reviewPanes}>
              <ReviewCodePane
                label="Source"
                ranges={comparison.originalRanges}
                source={comparison.originalSource}
              />
              <ReviewGuidancePane finding={activeFinding} rule={rule} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
