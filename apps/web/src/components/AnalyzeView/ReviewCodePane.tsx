import { useEffect, useMemo, useRef } from "react";

import type { BrowserReviewRange } from "../../analyzer/review";
import { rangesIntersect } from "../../analyzer/review";
import { highlightCodeLine } from "../../utils/highlightCode";
import codeStyles from "../CodeSnippet/CodeSnippet.module.css";
import styles from "./AnalyzeView.module.css";

interface ReviewCodePaneProps {
  label: string;
  ranges: readonly BrowserReviewRange[];
  source: string;
  tone: "neutral" | "original" | "proposed";
}

interface SourceLine {
  end: number;
  number: number;
  start: number;
  text: string;
}

const createSourceLines = (source: string): readonly SourceLine[] => {
  let lineStart = 0;

  return source.split("\n").map((text, index) => {
    const start = lineStart;
    lineStart += text.length + 1;

    return {
      end: start + text.length,
      number: index + 1,
      start,
      text,
    };
  });
};

const pointTouchesLine = (range: BrowserReviewRange, line: SourceLine) =>
  range.start === range.end &&
  range.start >= line.start &&
  range.start <= line.end;

const lineIsHighlighted = (
  line: SourceLine,
  ranges: readonly BrowserReviewRange[],
) => {
  const lineRange = {
    end: Math.max(line.start + 1, line.end),
    start: line.start,
  };

  return ranges.some(
    (range) =>
      rangesIntersect(range, lineRange) || pointTouchesLine(range, line),
  );
};

const segmentIsHighlighted = (
  start: number,
  end: number,
  ranges: readonly BrowserReviewRange[],
) =>
  ranges.some((range) =>
    range.start === range.end
      ? range.start >= start && range.start <= end
      : rangesIntersect(range, { end, start }),
  );

const ReviewCodeLine = ({
  line,
  ranges,
}: {
  line: SourceLine;
  ranges: readonly BrowserReviewRange[];
}) => {
  const highlighted = lineIsHighlighted(line, ranges);
  const tokens = highlightCodeLine(line.text);

  return (
    <span
      className={styles.reviewCodeLine}
      data-highlighted={highlighted || undefined}
      data-review-line={highlighted ? "active" : undefined}
    >
      <span aria-hidden="true" className={styles.reviewLineNumber}>
        {line.number}
      </span>
      <span className={styles.reviewLineCode}>
        {tokens.map((token) => {
          const tokenStart = line.start + token.start;
          const tokenEnd = tokenStart + token.text.length;
          const tokenHighlighted = segmentIsHighlighted(
            tokenStart,
            tokenEnd,
            ranges,
          );

          return (
            <span
              className={`${codeStyles[token.kind]}${
                tokenHighlighted ? ` ${styles.reviewCodeMark}` : ""
              }`}
              key={token.start}
            >
              {token.text}
            </span>
          );
        })}
      </span>
    </span>
  );
};

export const ReviewCodePane = ({
  label,
  ranges,
  source,
  tone,
}: ReviewCodePaneProps) => {
  const preRef = useRef<HTMLPreElement>(null);
  const lines = useMemo(() => createSourceLines(source), [source]);

  useEffect(() => {
    const pre = preRef.current;
    const activeLine = pre?.querySelector<HTMLElement>(
      '[data-review-line="active"]',
    );
    if (pre && activeLine) {
      pre.scrollTop = Math.max(
        0,
        activeLine.offsetTop -
          pre.clientHeight / 2 +
          activeLine.clientHeight / 2,
      );
    }
  }, [ranges, source]);

  return (
    <section className={styles.reviewCodePane} data-tone={tone}>
      <header className={styles.reviewCodeHeader}>
        <span aria-hidden="true" className={styles.reviewStatusDot} />
        <strong>{label}</strong>
      </header>
      <pre className={styles.reviewCodePre} ref={preRef}>
        <code>
          {lines.map((line) => (
            <ReviewCodeLine key={line.start} line={line} ranges={ranges} />
          ))}
        </code>
      </pre>
    </section>
  );
};
