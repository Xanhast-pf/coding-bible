import ts from "typescript";

import {
  analyzerFindingConfidences,
  analyzerFindingImpacts,
  analyzerLanguages,
  type AnalyzerCustomRule,
  type AnalyzerCustomRuleMatch,
  type AnalyzerFindingConfidence,
  type AnalyzerFindingImpact,
  type Detector,
} from "./types.ts";
import { createFinding, nodesOfKind } from "./utils.ts";

const customRuleIdPattern = /^[A-Z][A-Z0-9]*-\d{3}$/u;
const validConfidences = new Set<unknown>(analyzerFindingConfidences);
const validImpacts = new Set<unknown>(analyzerFindingImpacts);
const validLanguages = new Set<unknown>(analyzerLanguages);

const isAnalyzerFindingConfidence = (
  value: unknown,
): value is AnalyzerFindingConfidence => validConfidences.has(value);

const isAnalyzerFindingImpact = (
  value: unknown,
): value is AnalyzerFindingImpact => validImpacts.has(value);

const toRecord = (value: unknown, message: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(message);
  }
  return value as Record<string, unknown>;
};

const requireText = (value: unknown, name: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} must be a non-empty string.`);
  }
  return value;
};

const validateMatch = (
  value: unknown,
  name: string,
): AnalyzerCustomRuleMatch => {
  const match = toRecord(value, `${name} must be an object.`);
  if (match.kind === "import") {
    const source = requireText(match.source, `${name}.source`);
    if (
      match.mode !== undefined &&
      match.mode !== "exact" &&
      match.mode !== "prefix"
    ) {
      throw new Error(`${name}.mode must be "exact" or "prefix".`);
    }
    return {
      kind: "import",
      ...(match.mode === undefined ? {} : { mode: match.mode }),
      source,
    };
  }

  if (match.kind === "call") {
    return {
      callee: requireText(match.callee, `${name}.callee`),
      kind: "call",
    };
  }

  throw new Error(
    `${name}.kind must be one of the supported declarative matchers: "import" or "call".`,
  );
};

export const validateAnalyzerCustomRules = (
  value: unknown,
): readonly AnalyzerCustomRule[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error("customRules must be an array.");
  }

  const seenIds = new Set<string>();
  return value.map((item, index) => {
    const name = `customRules[${index}]`;
    const rule = toRecord(item, `${name} must be an object.`);
    const id = requireText(rule.id, `${name}.id`).toUpperCase();
    if (!customRuleIdPattern.test(id)) {
      throw new Error(`${name}.id must match PREFIX-000.`);
    }
    if (seenIds.has(id)) {
      throw new Error(`${name}.id duplicates custom rule "${id}".`);
    }
    seenIds.add(id);

    const confidence = rule.confidence;
    if (!isAnalyzerFindingConfidence(confidence)) {
      throw new Error(
        `${name}.confidence must be "certain", "strong", or "contextual".`,
      );
    }
    const impact = rule.impact;
    if (!isAnalyzerFindingImpact(impact)) {
      throw new Error(`${name}.impact must be "high", "medium", or "low".`);
    }

    const contextNote =
      rule.contextNote === undefined
        ? undefined
        : requireText(rule.contextNote, `${name}.contextNote`);
    if (confidence === "contextual" && !contextNote) {
      throw new Error(
        `${name}.contextNote is required for contextual findings.`,
      );
    }

    let languages: readonly (typeof analyzerLanguages)[number][] | undefined;
    if (rule.languages !== undefined) {
      if (
        !Array.isArray(rule.languages) ||
        rule.languages.length === 0 ||
        rule.languages.some((language) => !validLanguages.has(language))
      ) {
        throw new Error(
          `${name}.languages must contain one or more of: ${analyzerLanguages.join(", ")}.`,
        );
      }
      languages = [
        ...new Set(rule.languages),
      ] as readonly (typeof analyzerLanguages)[number][];
    }

    const url =
      rule.url === undefined ? undefined : requireText(rule.url, `${name}.url`);
    if (url && !url.startsWith("https://")) {
      throw new Error(`${name}.url must use HTTPS.`);
    }

    return {
      confidence,
      ...(contextNote ? { contextNote } : {}),
      id,
      impact,
      ...(languages ? { languages } : {}),
      match: validateMatch(rule.match, `${name}.match`),
      message: requireText(rule.message, `${name}.message`),
      rationale: requireText(rule.rationale, `${name}.rationale`),
      suggestion: requireText(rule.suggestion, `${name}.suggestion`),
      title: requireText(rule.title, `${name}.title`),
      ...(url ? { url } : {}),
    };
  });
};

export const defineCustomRule = <const TRule extends AnalyzerCustomRule>(
  rule: TRule,
): TRule => rule;

export const defineDetector = <const TDetector extends Detector>(
  detector: TDetector,
): TDetector => detector;

const moduleMatches = (
  actual: string,
  expected: string,
  mode: "exact" | "prefix" = "exact",
) => (mode === "prefix" ? actual.startsWith(expected) : actual === expected);

const createRuleFinding = (
  rule: AnalyzerCustomRule,
  detectorId: string,
  context: Parameters<Detector["analyze"]>[0],
  node: ts.Node,
) =>
  createFinding(context, node, {
    detectorId,
    message: rule.message,
    ruleId: rule.id,
    ruleRationale: rule.rationale,
    ruleTitle: rule.title,
    ...(rule.url ? { ruleUrl: rule.url } : {}),
    suggestion: rule.suggestion,
  });

const createImportDetector = (
  rule: AnalyzerCustomRule & {
    match: Extract<AnalyzerCustomRuleMatch, { kind: "import" }>;
  },
): Detector => {
  const detectorId = `custom-rule-${rule.id.toLowerCase()}-import`;
  return {
    dependencyScope: "source-file",
    id: detectorId,
    ...(rule.languages ? { languages: rule.languages } : {}),
    profile: {
      confidence: rule.confidence,
      ...(rule.contextNote ? { contextNote: rule.contextNote } : {}),
      impact: rule.impact,
    },
    ruleId: rule.id,
    analyze: (context) => {
      const findings = [];

      for (const node of nodesOfKind<ts.ImportDeclaration>(
        context,
        ts.SyntaxKind.ImportDeclaration,
      )) {
        if (
          ts.isStringLiteral(node.moduleSpecifier) &&
          moduleMatches(
            node.moduleSpecifier.text,
            rule.match.source,
            rule.match.mode,
          )
        ) {
          findings.push(
            createRuleFinding(rule, detectorId, context, node.moduleSpecifier),
          );
        }
      }

      for (const node of nodesOfKind<ts.ExportDeclaration>(
        context,
        ts.SyntaxKind.ExportDeclaration,
      )) {
        if (
          node.moduleSpecifier &&
          ts.isStringLiteral(node.moduleSpecifier) &&
          moduleMatches(
            node.moduleSpecifier.text,
            rule.match.source,
            rule.match.mode,
          )
        ) {
          findings.push(
            createRuleFinding(rule, detectorId, context, node.moduleSpecifier),
          );
        }
      }

      return findings;
    },
  };
};

const createCallDetector = (
  rule: AnalyzerCustomRule & {
    match: Extract<AnalyzerCustomRuleMatch, { kind: "call" }>;
  },
): Detector => {
  const detectorId = `custom-rule-${rule.id.toLowerCase()}-call`;
  return {
    dependencyScope: "source-file",
    id: detectorId,
    ...(rule.languages ? { languages: rule.languages } : {}),
    profile: {
      confidence: rule.confidence,
      ...(rule.contextNote ? { contextNote: rule.contextNote } : {}),
      impact: rule.impact,
    },
    ruleId: rule.id,
    analyze: (context) => {
      const findings = [];
      for (const node of nodesOfKind<ts.CallExpression>(
        context,
        ts.SyntaxKind.CallExpression,
      )) {
        if (node.expression.getText(context.sourceFile) !== rule.match.callee) {
          continue;
        }
        findings.push(
          createRuleFinding(rule, detectorId, context, node.expression),
        );
      }
      return findings;
    },
  };
};

export const createAnalyzerCustomRuleDetectors = (
  value: unknown,
): readonly Detector[] =>
  validateAnalyzerCustomRules(value).map((rule) =>
    rule.match.kind === "import"
      ? createImportDetector(
          rule as AnalyzerCustomRule & {
            match: Extract<AnalyzerCustomRuleMatch, { kind: "import" }>;
          },
        )
      : createCallDetector(
          rule as AnalyzerCustomRule & {
            match: Extract<AnalyzerCustomRuleMatch, { kind: "call" }>;
          },
        ),
  );
