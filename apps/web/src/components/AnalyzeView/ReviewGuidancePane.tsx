import type { CodingRule } from "@coding-bible/rules";

import type { BrowserAnalyzerFinding } from "../../analyzer/types";
import { highlightCodeLine } from "../../utils/highlightCode";
import codeStyles from "../CodeSnippet/CodeSnippet.module.css";
import styles from "./AnalyzeView.module.css";

interface ReviewGuidancePaneProps {
  finding: BrowserAnalyzerFinding;
  rule: CodingRule | undefined;
}

const GuidanceCode = ({ code }: { code: string }) => {
  let lineStart = 0;
  const lines = code.split("\n").map((text) => {
    const start = lineStart;
    lineStart += text.length + 1;
    return { start, text };
  });

  return (
    <pre className={styles.reviewGuidanceCode}>
      <code>
        {lines.map((line) => (
          <span className={styles.reviewGuidanceCodeLine} key={line.start}>
            {highlightCodeLine(line.text).map((token) => (
              <span className={codeStyles[token.kind]} key={token.start}>
                {token.text}
              </span>
            ))}
          </span>
        ))}
      </code>
    </pre>
  );
};

export const ReviewGuidancePane = ({
  finding,
  rule,
}: ReviewGuidancePaneProps) => {
  const fix = finding.fix;
  const hasStructuredFix = Boolean(fix?.edits?.length);
  const recommendation = fix?.description ?? finding.suggestion;

  return (
    <aside className={styles.reviewGuidancePane} aria-label="Analyzer guidance">
      <header className={styles.reviewGuidanceHeader}>
        <span aria-hidden="true" className={styles.reviewStatusDot} />
        <strong>Analyzer guidance</strong>
      </header>

      <div className={styles.reviewGuidanceBody}>
        <section className={styles.reviewGuidanceSection}>
          <span className={styles.reviewGuidanceLabel}>Issue</span>
          <h5>{finding.message}</h5>
          <p>
            {hasStructuredFix
              ? "Coding Bible has a structured edit for this finding."
              : "This finding needs a code decision rather than a mechanical replacement."}
          </p>
        </section>

        {finding.contextNote ? (
          <section
            className={styles.reviewContextDisclaimer}
            data-confidence={finding.confidence}
          >
            <span className={styles.reviewGuidanceLabel}>
              {finding.confidence === "contextual"
                ? "Context required"
                : "Analyzer note"}
            </span>
            <p>{finding.contextNote}</p>
          </section>
        ) : null}

        <section className={styles.reviewGuidanceSection}>
          <div className={styles.reviewGuidanceTitleRow}>
            <span className={styles.reviewGuidanceLabel}>Recommended fix</span>
            <span
              className={styles.reviewGuidanceBadge}
              data-safety={fix?.safety ?? "manual"}
            >
              {fix?.safety === "safe"
                ? "safe edit"
                : fix?.safety === "review"
                  ? "review edit"
                  : "manual review"}
            </span>
          </div>
          <h5>{fix?.title ?? "Apply the rule intentionally"}</h5>
          <p>{recommendation}</p>
        </section>

        {rule ? (
          <section className={styles.reviewGuidanceSection}>
            <div className={styles.reviewGuidanceTitleRow}>
              <span className={styles.reviewGuidanceLabel}>Rule reminder</span>
              <a
                className={styles.reviewGuidanceRuleLink}
                href={`./#${rule.id}`}
              >
                {rule.id} ↗
              </a>
            </div>
            <h5>{rule.title}</h5>
            <p>{rule.summary}</p>
            <p className={styles.reviewGuidanceRationale}>{rule.rationale}</p>

            {rule.good ? (
              <div className={styles.reviewGuidanceExample}>
                <span>Preferred pattern · {rule.good.language}</span>
                <GuidanceCode code={rule.good.code} />
                {rule.good.note ? <p>{rule.good.note}</p> : null}
              </div>
            ) : null}

            {rule.exceptions?.length ? (
              <div className={styles.reviewGuidanceExceptions}>
                <span>Exceptions</span>
                <ul>
                  {rule.exceptions.map((exception) => (
                    <li key={exception}>{exception}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {rule.references?.length ? (
              <div className={styles.reviewGuidanceReferences}>
                {rule.references.map((reference) => (
                  <a
                    href={reference.url}
                    key={reference.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {reference.label} ↗
                  </a>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </aside>
  );
};
