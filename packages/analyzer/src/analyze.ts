import ts from "typescript";

import {
  createDetectorContext,
  createDetectorContexts,
  createDetectorContextsFromProgram,
  type ResolvedAnalyzeInput,
} from "./context.ts";
import { detectors } from "./detectors/index.ts";
import type {
  AnalyzeInput,
  AnalyzeOptions,
  AnalyzeResult,
  AnalyzerDiagnostic,
  AnalyzerLanguage,
  Detector,
  DetectorContext,
  ProgramAnalyzeInput,
} from "./types.ts";

const defaultFileNameByLanguage = {
  js: "snippet.js",
  jsx: "snippet.jsx",
  ts: "snippet.ts",
  tsx: "snippet.tsx",
} satisfies Record<AnalyzerLanguage, string>;

const getApplicableDetectors = (
  language: AnalyzerLanguage,
  fileName: string,
  options: AnalyzeOptions,
): readonly Detector[] =>
  detectors.filter(
    (detector) =>
      (!detector.languages || detector.languages.includes(language)) &&
      (options.isRuleEnabled?.(detector.ruleId, fileName) ?? true),
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

const analyzeContext = (
  context: DetectorContext,
  options: AnalyzeOptions,
): AnalyzeResult => {
  options.signal?.throwIfAborted();
  const applicableDetectors = getApplicableDetectors(
    context.language,
    context.sourceFile.fileName,
    options,
  );
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

  const rawFindings = [];
  for (const detector of applicableDetectors) {
    options.signal?.throwIfAborted();
    rawFindings.push(...detector.analyze(context));
  }
  const findings = dedupeFindings(rawFindings);

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

const emptyResult = (
  language: AnalyzerLanguage,
  fileName: string,
  options: AnalyzeOptions,
): AnalyzeResult => {
  const applicableDetectors = getApplicableDetectors(language, fileName, options);

  return {
    checksRun: applicableDetectors.length,
    diagnostics: [],
    findings: [],
    ruleIdsChecked: [
      ...new Set(applicableDetectors.map((detector) => detector.ruleId)),
    ].sort(),
  };
};

export const analyzeMany = (
  inputs: readonly AnalyzeInput[],
  options: AnalyzeOptions = {},
): readonly AnalyzeResult[] => {
  if (!inputs.length) {
    return [];
  }

  const results: AnalyzeResult[] = Array(inputs.length);
  const nonEmptyInputs: ResolvedAnalyzeInput[] = [];
  const nonEmptyIndexes: number[] = [];

  inputs.forEach((input, index) => {
    const resolved = resolveInput(input, index);

    if (!input.source.trim()) {
      results[index] = emptyResult(resolved.language, resolved.fileName, options);
      return;
    }

    nonEmptyInputs.push(resolved);
    nonEmptyIndexes.push(index);
  });

  options.signal?.throwIfAborted();
  const contexts = createDetectorContexts(nonEmptyInputs);
  contexts.forEach((context, contextIndex) => {
    options.signal?.throwIfAborted();
    const resultIndex = nonEmptyIndexes[contextIndex];
    if (resultIndex !== undefined) {
      results[resultIndex] = analyzeContext(context, options);
    }
  });

  return results;
};

export const analyzeProgram = (
  program: ts.Program,
  inputs: readonly ProgramAnalyzeInput[],
  options: AnalyzeOptions = {},
): readonly AnalyzeResult[] => {
  if (!inputs.length) {
    return [];
  }

  options.signal?.throwIfAborted();
  const resolvedInputs = inputs.map((input): ResolvedAnalyzeInput => {
    const sourceFile = program.getSourceFile(input.fileName);
    if (!sourceFile) {
      throw new Error(`Analyzer could not find ${input.fileName} in the TypeScript project.`);
    }

    return {
      fileName: input.fileName,
      language: input.language,
      source: sourceFile.text,
    };
  });

  return createDetectorContextsFromProgram(resolvedInputs, program).map((context) => {
    options.signal?.throwIfAborted();
    return analyzeContext(context, options);
  });
};

export const analyze = (
  input: AnalyzeInput,
  options: AnalyzeOptions = {},
): AnalyzeResult => {
  const resolved = resolveInput(input);

  if (!input.source.trim()) {
    return emptyResult(resolved.language, resolved.fileName, options);
  }

  return analyzeContext(createDetectorContext(resolved), options);
};
