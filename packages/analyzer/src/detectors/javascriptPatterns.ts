import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import { createFinding, isExecutableFunction, visit } from "../utils.ts";

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

const getPropertyPath = (expression: ts.Expression): readonly string[] | null => {
  if (ts.isIdentifier(expression)) {
    return [expression.text];
  }

  if (ts.isPropertyAccessExpression(expression)) {
    const parentPath = getPropertyPath(expression.expression);
    return parentPath ? [...parentPath, expression.name.text] : null;
  }

  return null;
};

const isExtendingPath = (previous: readonly string[], next: readonly string[]) =>
  next.length > previous.length && previous.every((part, index) => next[index] === part);

export const optionalChainingDetector: Detector = {
  id: "optional-chaining-guard-chain",
  ruleId: "JS-002",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    visit(context.sourceFile, (node) => {
      if (
        !ts.isBinaryExpression(node) ||
        node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken ||
        (ts.isBinaryExpression(node.parent) &&
          node.parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken)
      ) {
        return;
      }

      const operands = flattenLogicalAnd(node);
      if (operands.length < 2) {
        return;
      }

      const paths = operands.map(getPropertyPath);
      if (
        paths.some((path) => !path) ||
        !paths.slice(1).every((path, index) => {
          const previous = paths[index];
          return Boolean(previous && path && isExtendingPath(previous, path));
        })
      ) {
        return;
      }

      findings.push(
        createFinding(context, node, {
          detectorId: "optional-chaining-guard-chain",
          message: "This repeated nullish access guard can be expressed more clearly with optional chaining.",
          ruleId: "JS-002",
          suggestion:
            "Use optional chaining when null/undefined are the values you intend to guard against.",
        }),
      );
    });

    return findings;
  },
};

export const defaultParameterDetector: Detector = {
  id: "default-parameter-normalization",
  ruleId: "JS-003",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    visit(context.sourceFile, (node) => {
      if (!isExecutableFunction(node) || !node.body || !ts.isBlock(node.body)) {
        return;
      }

      const parameters = new Map(
        node.parameters
          .filter((parameter) => ts.isIdentifier(parameter.name) && !parameter.initializer)
          .map((parameter) => [
            (parameter.name as ts.Identifier).text,
            parameter,
          ]),
      );

      if (!parameters.size) {
        return;
      }

      for (const statement of node.body.statements) {
        if (!ts.isExpressionStatement(statement) || !ts.isBinaryExpression(statement.expression)) {
          continue;
        }

        const assignment = statement.expression;
        if (
          assignment.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
          !ts.isIdentifier(assignment.left) ||
          !parameters.has(assignment.left.text) ||
          !ts.isBinaryExpression(assignment.right) ||
          assignment.right.operatorToken.kind !== ts.SyntaxKind.QuestionQuestionToken ||
          !ts.isIdentifier(assignment.right.left) ||
          assignment.right.left.text !== assignment.left.text
        ) {
          continue;
        }

        findings.push(
          createFinding(context, assignment, {
            detectorId: "default-parameter-normalization",
            message: `\`${assignment.left.text}\` is normalized from undefined inside the function body.`,
            ruleId: "JS-003",
            suggestion: "Express this default directly in the parameter list.",
          }),
        );
      }
    });

    return findings;
  },
};

const nonMutatingReplacementByMethod = new Map([
  ["sort", "toSorted"],
  ["reverse", "toReversed"],
]);

export const nonMutatingCollectionDetector: Detector = {
  id: "non-mutating-collection-copy",
  ruleId: "JS-006",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    visit(context.sourceFile, (node) => {
      if (
        !ts.isVariableDeclaration(node) ||
        !ts.isIdentifier(node.name) ||
        !node.initializer ||
        !ts.isCallExpression(node.initializer) ||
        !ts.isPropertyAccessExpression(node.initializer.expression) ||
        !ts.isIdentifier(node.initializer.expression.expression)
      ) {
        return;
      }

      const receiver = node.initializer.expression.expression;
      const method = node.initializer.expression.name.text;
      const replacement = nonMutatingReplacementByMethod.get(method);

      if (!replacement || receiver.text === node.name.text) {
        return;
      }

      findings.push(
        createFinding(context, node.initializer, {
          detectorId: "non-mutating-collection-copy",
          message:
            `\`${receiver.text}.${method}()\` mutates \`${receiver.text}\` while its result is stored as a separate value.`,
          ruleId: "JS-006",
          suggestion: `Use \`${receiver.text}.${replacement}(...)\` when the original collection should remain unchanged.`,
        }),
      );
    });

    return findings;
  },
};
