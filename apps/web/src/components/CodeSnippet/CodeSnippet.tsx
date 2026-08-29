import { memo } from "react";

import { CopyButton } from "../CopyButton/CopyButton";
import { highlightCodeLine } from "../../utils/highlightCode";
import styles from "./CodeSnippet.module.css";

type SnippetTone = "good" | "bad";

interface CodeSnippetProps {
  code: string;
  language: string;
  tone: SnippetTone;
}

const CodeSnippetComponent = ({ code, language, tone }: CodeSnippetProps) => {
  let lineNumber = 0;
  let lineStart = 0;
  const lines = code.split("\n").map((text) => {
    lineNumber += 1;
    const line = { number: lineNumber, start: lineStart, text };
    lineStart += text.length + 1;
    return line;
  });

  return (
    <div className={styles.snippet} data-tone={tone}>
      <div className={styles.toolbar}>
        <span aria-hidden="true" className={styles.statusDot} />
        <span className={styles.language}>{language}</span>
        <span className={styles.toolbarSpacer} />
        <CopyButton label="Copy" value={code} />
      </div>

      <pre className={styles.pre}>
        <code>
          {lines.map((line) => (
            <span className={styles.line} key={line.start}>
              <span aria-hidden="true" className={styles.lineNumber}>
                {line.number}
              </span>
              <span className={styles.lineCode}>
                {highlightCodeLine(line.text).map((token) => (
                  <span className={styles[token.kind]} key={token.start}>
                    {token.text}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
};

// Rule snippets are immutable; avoid re-tokenizing them on every search/filter update.
export const CodeSnippet = memo(CodeSnippetComponent);
