import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../../types.ts";

const suppressionPattern =
  /eslint-disable(?:-next-line|-line)?[^\n]*react-hooks\/exhaustive-deps/;

const getCommentRanges = (sourceFile: ts.SourceFile, source: string) => {
  const ranges = new Map<string, ts.CommentRange>();
  const add = (items: readonly ts.CommentRange[] | undefined) => {
    for (const item of items ?? []) {
      ranges.set(`${item.pos}:${item.end}`, item);
    }
  };

  const visit = (node: ts.Node) => {
    add(ts.getLeadingCommentRanges(source, node.getFullStart()));
    add(ts.getTrailingCommentRanges(source, node.end));
    for (const child of node.getChildren(sourceFile)) {
      visit(child);
    }
  };

  visit(sourceFile);
  return [...ranges.values()].sort((left, right) => left.pos - right.pos);
};

export const react012HookDependencySuppressionsDetector: Detector = {
  dependencyScope: "source-file",
  id: "react-hook-dependency-suppression",
  ruleId: "REACT-012",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    for (const range of getCommentRanges(context.sourceFile, context.source)) {
      const comment = context.source.slice(range.pos, range.end);
      const match = suppressionPattern.exec(comment);
      if (!match) {
        continue;
      }

      const start = range.pos + match.index;
      const end = start + match[0].length;
      const startPosition =
        context.sourceFile.getLineAndCharacterOfPosition(start);
      const endPosition = context.sourceFile.getLineAndCharacterOfPosition(end);
      const lineStart = context.sourceFile.getPositionOfLineAndCharacter(
        startPosition.line,
        0,
      );
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

export const react012Detectors = [
  react012HookDependencySuppressionsDetector,
] satisfies readonly Detector[];
