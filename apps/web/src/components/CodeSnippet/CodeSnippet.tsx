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
  const lines = code.split("\n");

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
          {lines.map((line, lineIndex) => (
            <span className={styles.line} key={`${lineIndex}-${line}`}>
              <span aria-hidden="true" className={styles.lineNumber}>
                {lineIndex + 1}
              </span>
              <span className={styles.lineCode}>
                {highlightCodeLine(line).map((token, tokenIndex) => (
                  <span
                    className={styles[token.kind]}
                    key={`${tokenIndex}-${token.text}`}
                  >
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
