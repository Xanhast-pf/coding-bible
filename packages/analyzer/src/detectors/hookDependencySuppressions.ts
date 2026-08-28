import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";

const suppressionPattern = /eslint-disable(?:-next-line|-line)?[^\n]*react-hooks\/exhaustive-deps/g;

export const hookDependencySuppressionsDetector: Detector = {
  id: "react-hook-dependency-suppression",
  ruleId: "REACT-012",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    for (const match of context.source.matchAll(suppressionPattern)) {
      const start = match.index;
      const end = start + match[0].length;
      const startPosition = context.sourceFile.getLineAndCharacterOfPosition(start);
      const endPosition = context.sourceFile.getLineAndCharacterOfPosition(end);
      const lineStart = context.sourceFile.getPositionOfLineAndCharacter(startPosition.line, 0);
      const lineEnd = context.sourceFile.getLineEndOfPosition(start);

      findings.push({
        detectorId: "react-hook-dependency-suppression",
        excerpt: context.source.slice(lineStart, lineEnd).trimEnd(),
        location: {
          column: startPosition.character + 1,
          endColumn: endPosition.character + 1,
          endLine: endPosition.line + 1,
          line: startPosition.line + 1,
        },
        message: "Hook dependency correctness is being suppressed.",
        ruleId: "REACT-012",
        suggestion:
          "Fix the dependency model instead of preserving a stale closure with an eslint suppression.",
      });
    }

    return findings;
  },
};
