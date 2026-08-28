import type { ReactNode } from "react";

import { CopyButton } from "../CopyButton/CopyButton";
import styles from "./CodeSnippet.module.css";

type SnippetTone = "good" | "bad";

interface CodeSnippetProps {
  code: string;
  language: string;
  tone: SnippetTone;
}

const tokenPattern =
  /(\/\/.*$|\/\*.*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\b(?:as|async|await|break|case|catch|class|const|continue|default|else|export|extends|false|finally|for|from|function|if|fragment|implements|import|in|interface|keyof|let|mutation|new|null|of|on|query|readonly|return|satisfies|subscription|switch|throw|true|try|type|typeof|undefined|unknown|var|void|while)\b|\b\d+(?:\.\d+)?\b|<\/?[A-Za-z][A-Za-z0-9.-]*|[A-Za-z_$][\w$]*(?=\s*\()|[=!<>+\-*/&|?:]+|\b[A-Z][A-Za-z0-9_$]*\b)/g;

const getTokenKind = (token: string) => {
  if (token.startsWith("//") || token.startsWith("/*")) {
    return "comment";
  }

  if (
    token.startsWith('"') ||
    token.startsWith("'") ||
    token.startsWith("`")
  ) {
    return "string";
  }

  if (/^\d/.test(token)) {
    return "number";
  }

  if (/^<\/?[A-Za-z]/.test(token)) {
    return "tag";
  }

  if (/^[A-Z]/.test(token)) {
    return "type";
  }

  if (/^[=!<>+\-*/&|?:]+$/.test(token)) {
    return "operator";
  }

  if (token.endsWith("(") || /^[A-Za-z_$][\w$]*$/.test(token)) {
    const keywords = new Set([
      "as",
      "async",
      "await",
      "break",
      "case",
      "catch",
      "class",
      "const",
      "continue",
      "default",
      "else",
      "export",
      "extends",
      "false",
      "finally",
      "subscription",
      "query",
      "on",
      "mutation",
      "fragment",
      "for",
      "from",
      "function",
      "if",
      "implements",
      "import",
      "in",
      "interface",
      "keyof",
      "let",
      "new",
      "null",
      "of",
      "readonly",
      "return",
      "satisfies",
      "switch",
      "throw",
      "true",
      "try",
      "type",
      "typeof",
      "undefined",
      "unknown",
      "var",
      "void",
      "while",
    ]);

    if (keywords.has(token)) {
      return "keyword";
    }

    return "function";
  }

  return "plain";
};

const highlightLine = (line: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of line.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    const token = match[0];

    if (index > cursor) {
      nodes.push(line.slice(cursor, index));
    }

    nodes.push(
      <span className={styles[getTokenKind(token)]} key={`${index}-${token}`}>
        {token}
      </span>,
    );

    cursor = index + token.length;
  }

  if (cursor < line.length) {
    nodes.push(line.slice(cursor));
  }

  return nodes;
};

export const CodeSnippet = ({ code, language, tone }: CodeSnippetProps) => {
  const lines = code.split("\n");

  return (
    <div className={styles.snippet} data-tone={tone}>
      <div className={styles.toolbar}>
        <span className={styles.statusDot} />
        <span className={styles.language}>{language}</span>
        <span className={styles.toolbarSpacer} />
        <CopyButton label="Copy" value={code} />
      </div>

      <pre className={styles.pre}>
        <code>
          {lines.map((line, index) => (
            <span className={styles.line} key={`${index}-${line}`}>
              <span aria-hidden="true" className={styles.lineNumber}>
                {index + 1}
              </span>
              <span className={styles.lineCode}>{highlightLine(line)}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
};
