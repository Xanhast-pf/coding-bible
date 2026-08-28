import ts from "typescript";

import { detectors } from "./detectors/index.ts";
import type { AnalyzeInput, AnalyzeResult, AnalyzerLanguage } from "./types.ts";

const scriptKindByLanguage = {
  js: ts.ScriptKind.JS,
  jsx: ts.ScriptKind.JSX,
  ts: ts.ScriptKind.TS,
  tsx: ts.ScriptKind.TSX,
} satisfies Record<AnalyzerLanguage, ts.ScriptKind>;

const ruleIdsChecked = [...new Set(detectors.map((detector) => detector.ruleId))].sort();

const defaultFileNameByLanguage = {
  js: "snippet.js",
  jsx: "snippet.jsx",
  ts: "snippet.ts",
  tsx: "snippet.tsx",
} satisfies Record<AnalyzerLanguage, string>;

export const analyze = ({ fileName, language, source }: AnalyzeInput): AnalyzeResult => {
  if (!source.trim()) {
    return { checksRun: detectors.length, findings: [], ruleIdsChecked };
  }

  const sourceFile = ts.createSourceFile(
    fileName ?? defaultFileNameByLanguage[language],
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindByLanguage[language],
  );
  const context = { source, sourceFile };
  const findings = detectors.flatMap((detector) => detector.analyze(context));

  findings.sort(
    (left, right) =>
      left.location.line - right.location.line ||
      left.location.column - right.location.column ||
      left.ruleId.localeCompare(right.ruleId),
  );

  return {
    checksRun: detectors.length,
    findings,
    ruleIdsChecked,
  };
};
