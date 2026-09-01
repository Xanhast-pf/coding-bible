import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../../types.ts";
import { createFinding, nodesOfKind, unwrapExpression } from "../../utils.ts";

const flattenLogicalAnd = (expression: ts.Expression): ts.Expression[] => {
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
  ) {
    return [
      ...flattenLogicalAnd(expression.left),
      ...flattenLogicalAnd(expression.right),
    ];
  }

  return [expression];
};

const getStaticElementName = (expression: ts.ElementAccessExpression) => {
  const argument = expression.argumentExpression;
  return argument &&
    (ts.isStringLiteral(argument) || ts.isNumericLiteral(argument))
    ? argument.text
    : null;
};

const getPropertyPath = (
  expression: ts.Expression,
): readonly string[] | null => {
  const candidate = unwrapExpression(expression);

  if (ts.isIdentifier(candidate)) {
    return [candidate.text];
  }

  if (ts.isPropertyAccessExpression(candidate)) {
    const parentPath = getPropertyPath(candidate.expression);
    return parentPath ? [...parentPath, candidate.name.text] : null;
  }

  if (ts.isElementAccessExpression(candidate)) {
    const parentPath = getPropertyPath(candidate.expression);
    const elementName = getStaticElementName(candidate);
    return parentPath && elementName !== null
      ? [...parentPath, elementName]
      : null;
  }

  return null;
};

const isExtendingPath = (
  previous: readonly string[],
  next: readonly string[],
) =>
  next.length > previous.length &&
  previous.every((part, index) => next[index] === part);

export const js002OptionalChainingDetector: Detector = {
  dependencyScope: "source-file",
  id: "optional-chaining-guard-chain",
  ruleId: "JS-002",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    for (const node of nodesOfKind<ts.BinaryExpression>(
      context,
      ts.SyntaxKind.BinaryExpression,
    )) {
      if (
        node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken ||
        (ts.isBinaryExpression(node.parent) &&
          node.parent.operatorToken.kind ===
            ts.SyntaxKind.AmpersandAmpersandToken)
      ) {
        continue;
      }

      const operands = flattenLogicalAnd(node);
      if (operands.length < 2) {
        continue;
      }

      const paths = operands.map(getPropertyPath);
      if (
        paths.some((path) => !path) ||
        !paths.slice(1).every((path, index) => {
          const previous = paths[index];
          return Boolean(previous && path && isExtendingPath(previous, path));
        })
      ) {
        continue;
      }

      findings.push(
        createFinding(context, node, {
          detectorId: "optional-chaining-guard-chain",
          message:
            "This repeated nullish access guard can be expressed more clearly with optional chaining.",
          ruleId: "JS-002",
          suggestion:
            "Use optional chaining when null/undefined are the values you intend to guard against.",
        }),
      );
    }

    return findings;
  },
};

export const js002Detectors = [
  js002OptionalChainingDetector,
] satisfies readonly Detector[];
