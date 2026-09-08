import ts from "typescript";

import type {
  AnalyzerDetectorProfile,
  AnalyzerFinding,
  AnalyzerLanguage,
  Detector,
  DetectorContext,
} from "../../types.ts";
import { createRangeFinding } from "../../utils.ts";

const embeddedSourcePropertyNames = new Set(["code", "diff", "source"]);
const maskedEvidenceSourceByFile = new WeakMap<ts.SourceFile, string>();

const propertyNameText = (name: ts.PropertyName): string | null => {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text;
  return null;
};

const maskEmbeddedSourceText = (context: DetectorContext): string => {
  const cached = maskedEvidenceSourceByFile.get(context.sourceFile);
  if (cached !== undefined) return cached;

  const ranges: Array<{ start: number; end: number }> = [];
  const visit = (node: ts.Node): void => {
    const parent = node.parent;
    if (
      parent &&
      ts.isPropertyAssignment(parent) &&
      parent.initializer === node &&
      embeddedSourcePropertyNames.has(propertyNameText(parent.name) ?? "") &&
      (ts.isStringLiteralLike(node) ||
        ts.isNoSubstitutionTemplateLiteral(node) ||
        ts.isTemplateExpression(node))
    ) {
      ranges.push({
        start: node.getStart(context.sourceFile),
        end: node.getEnd(),
      });
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(context.sourceFile);

  if (!ranges.length) {
    maskedEvidenceSourceByFile.set(context.sourceFile, context.source);
    return context.source;
  }

  const characters = [...context.source];
  for (const { start, end } of ranges) {
    for (let index = start; index < end; index += 1) {
      if (characters[index] !== "\n" && characters[index] !== "\r") {
        characters[index] = " ";
      }
    }
  }
  const masked = characters.join("");
  maskedEvidenceSourceByFile.set(context.sourceFile, masked);
  return masked;
};

export interface SourceEvidence {
  end: number;
  message?: string;
  start: number;
}

export interface SourceEvidenceDetectorOptions {
  dependencyScope?: "project" | "source-file";
  find: (context: DetectorContext) => readonly SourceEvidence[];
  id: string;
  languages: readonly AnalyzerLanguage[];
  message: string;
  profile: AnalyzerDetectorProfile;
  ruleId: string;
  suggestion: string;
}

export const evidenceFromRegex = (
  source: string,
  pattern: RegExp,
): readonly SourceEvidence[] => {
  const flags = pattern.flags.includes("g")
    ? pattern.flags
    : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);
  const evidence: SourceEvidence[] = [];
  for (const match of source.matchAll(regex)) {
    const start = match.index ?? 0;
    evidence.push({ start, end: start + Math.max(1, match[0].length) });
  }
  return evidence;
};

export const firstEvidence = (
  source: string,
  pattern: RegExp,
): readonly SourceEvidence[] => {
  const flags = pattern.flags.replaceAll("g", "");
  const match = new RegExp(pattern.source, flags).exec(source);
  if (!match) return [];
  const start = match.index;
  return [{ start, end: start + Math.max(1, match[0].length) }];
};

export const createSourceEvidenceDetector = (
  options: SourceEvidenceDetectorOptions,
): Detector => ({
  dependencyScope: options.dependencyScope ?? "source-file",
  id: options.id,
  languages: options.languages,
  profile: options.profile,
  ruleId: options.ruleId,
  analyze: (context): readonly AnalyzerFinding[] => {
    const evidenceContext = {
      ...context,
      source: maskEmbeddedSourceText(context),
    } satisfies DetectorContext;
    return options.find(evidenceContext).map((evidence) =>
      createRangeFinding(context, evidence.start, evidence.end, {
        detectorId: options.id,
        message: evidence.message ?? options.message,
        ruleId: options.ruleId,
        suggestion: options.suggestion,
      }),
    );
  },
});

export const conjunctiveEvidence = (
  source: string,
  required: readonly RegExp[],
  forbidden: readonly RegExp[] = [],
): readonly SourceEvidence[] => {
  if (forbidden.some((pattern) => pattern.test(source))) return [];
  const matches = required.map((pattern) => {
    const flags = pattern.flags.replaceAll("g", "");
    return new RegExp(pattern.source, flags).exec(source);
  });
  if (matches.some((match) => !match)) return [];
  const first = matches.find((match) => match !== null);
  if (!first) return [];
  const start = first.index;
  return [{ start, end: start + Math.max(1, first[0].length) }];
};
