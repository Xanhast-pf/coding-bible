export type HighlightTokenKind =
  | "comment"
  | "function"
  | "keyword"
  | "number"
  | "operator"
  | "plain"
  | "string"
  | "tag"
  | "type";

export interface HighlightToken {
  kind: HighlightTokenKind;
  start: number;
  text: string;
}

const keywords = [
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
  "for",
  "fragment",
  "from",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "interface",
  "keyof",
  "let",
  "mutation",
  "new",
  "null",
  "of",
  "on",
  "query",
  "readonly",
  "return",
  "satisfies",
  "subscription",
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
] as const;

const keywordSet = new Set<string>(keywords);
const keywordPattern = `\\b(?:${keywords.join("|")})\\b`;
const tokenPattern = new RegExp(
  [
    "//.*$",
    "/\\*.*?\\*/",
    "'(?:\\\\.|[^'\\\\])*'",
    '"(?:\\\\.|[^"\\\\])*"',
    "`(?:\\\\.|[^`\\\\])*`",
    keywordPattern,
    "\\b\\d+(?:\\.\\d+)?\\b",
    "<\\/?[A-Za-z][A-Za-z0-9.-]*",
    "[A-Za-z_$][\\w$]*(?=\\s*\\()",
    "[=!<>+\\-*/&|?:]+",
    "\\b[A-Z][A-Za-z0-9_$]*\\b",
  ].join("|"),
  "g",
);

const getTokenKind = (token: string): HighlightTokenKind => {
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

  if (keywordSet.has(token)) {
    return "keyword";
  }

  if (/^[A-Z]/.test(token)) {
    return "type";
  }

  if (/^[=!<>+\-*/&|?:]+$/.test(token)) {
    return "operator";
  }

  return "function";
};

export const highlightCodeLine = (line: string): readonly HighlightToken[] => {
  const tokens: HighlightToken[] = [];
  let cursor = 0;

  for (const match of line.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    const text = match[0];

    if (index > cursor) {
      tokens.push({
        kind: "plain",
        start: cursor,
        text: line.slice(cursor, index),
      });
    }

    tokens.push({
      kind: getTokenKind(text),
      start: index,
      text,
    });

    cursor = index + text.length;
  }

  if (cursor < line.length) {
    tokens.push({
      kind: "plain",
      start: cursor,
      text: line.slice(cursor),
    });
  }

  return tokens;
};
