import ts from "typescript";

import {
  createDetectorContext,
  createDetectorContexts,
  type ResolvedAnalyzeInput,
} from "./context.ts";
import { detectors } from "./detectors/index.ts";
import type {
  AnalyzeInput,
  AnalyzeResult,
  AnalyzerDiagnostic,
  AnalyzerLanguage,
  Detector,
  DetectorContext,
} from "./types.ts";

const defaultFileNameByLanguage = {
  js: "snippet.js",
  jsx: "snippet.jsx",
  ts: "snippet.ts",
  tsx: "snippet.tsx",
} satisfies Record<AnalyzerLanguage, string>;

const getApplicableDetectors = (
  language: AnalyzerLanguage,
): readonly Detector[] =>
  detectors.filter(
    (detector) => !detector.languages || detector.languages.includes(language),
  );

const createDiagnostic = (
  context: DetectorContext,
  diagnostic: ts.Diagnostic,
): AnalyzerDiagnostic => {
  const start = diagnostic.start ?? 0;
  const length = diagnostic.length ?? 1;
  const end = Math.min(start + length, context.source.length);
  const startPosition = context.sourceFile.getLineAndCharacterOfPosition(start);
  const endPosition = context.sourceFile.getLineAndCharacterOfPosition(end);
  const lineStart = context.sourceFile.getPositionOfLineAndCharacter(
    startPosition.line,
    0,
  );
  const lineEnd = context.sourceFile.getLineEndOfPosition(start);

  return {
    excerpt: context.source.slice(lineStart, lineEnd).trimEnd(),
    location: {
      column: startPosition.character + 1,
      endColumn: endPosition.character + 1,
      endLine: endPosition.line + 1,
      line: startPosition.line + 1,
    },
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
  };
};

const dedupeFindings = (findings: AnalyzeResult["findings"]) => {
  const seen = new Set<string>();

  return findings.filter((finding) => {
    const key = [
      finding.detectorId,
      finding.ruleId,
      finding.location.line,
      finding.location.column,
      finding.location.endLine,
      finding.location.endColumn,
    ].join(":");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const analyzeContext = (context: DetectorContext): AnalyzeResult => {
  const applicableDetectors = getApplicableDetectors(context.language);
  const applicableRuleIds = [
    ...new Set(applicableDetectors.map((detector) => detector.ruleId)),
  ].sort();
  const diagnostics = context.program
    .getSyntacticDiagnostics(context.sourceFile)
    .map((diagnostic) => createDiagnostic(context, diagnostic));

  if (diagnostics.length) {
    return {
      checksRun: 0,
      diagnostics,
      findings: [],
      ruleIdsChecked: [],
    };
  }

  const findings = dedupeFindings(
    applicableDetectors.flatMap((detector) => detector.analyze(context)),
  );

  findings.sort(
    (left, right) =>
      left.location.line - right.location.line ||
      left.location.column - right.location.column ||
      left.ruleId.localeCompare(right.ruleId) ||
      left.detectorId.localeCompare(right.detectorId),
  );

  return {
    checksRun: applicableDetectors.length,
    diagnostics,
    findings,
    ruleIdsChecked: applicableRuleIds,
  };
};

const resolveInput = (input: AnalyzeInput, index = 0): ResolvedAnalyzeInput => ({
  fileName:
    input.fileName ??
    (index === 0
      ? defaultFileNameByLanguage[input.language]
      : `snippet-${index}.${input.language}`),
  language: input.language,
  source: input.source,
});

export const analyzeMany = (
  inputs: readonly AnalyzeInput[],
): readonly AnalyzeResult[] => {
  if (!inputs.length) {
    return [];
  }

  const results: AnalyzeResult[] = Array(inputs.length);
  const nonEmptyInputs: ResolvedAnalyzeInput[] = [];
  const nonEmptyIndexes: number[] = [];

  inputs.forEach((input, index) => {
    const applicableDetectors = getApplicableDetectors(input.language);
    const applicableRuleIds = [
      ...new Set(applicableDetectors.map((detector) => detector.ruleId)),
    ].sort();

    if (!input.source.trim()) {
      results[index] = {
        checksRun: applicableDetectors.length,
        diagnostics: [],
        findings: [],
        ruleIdsChecked: applicableRuleIds,
      };
      return;
    }

    nonEmptyInputs.push(resolveInput(input, index));
    nonEmptyIndexes.push(index);
  });

  const contexts = createDetectorContexts(nonEmptyInputs);
  contexts.forEach((context, contextIndex) => {
    const resultIndex = nonEmptyIndexes[contextIndex];
    if (resultIndex !== undefined) {
      results[resultIndex] = analyzeContext(context);
    }
  });

  return results;
};

export const analyze = (input: AnalyzeInput): AnalyzeResult => {
  if (!input.source.trim()) {
    const applicableDetectors = getApplicableDetectors(input.language);
    return {
      checksRun: applicableDetectors.length,
      diagnostics: [],
      findings: [],
      ruleIdsChecked: [
        ...new Set(applicableDetectors.map((detector) => detector.ruleId)),
      ].sort(),
    };
  }

  return analyzeContext(createDetectorContext(resolveInput(input)));
};
