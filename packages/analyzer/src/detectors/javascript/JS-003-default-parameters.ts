import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../../types.ts";
import { createFinding, isExecutableFunction, visit } from "../../utils.ts";

const typeContainsNull = (type: ts.TypeNode | undefined): boolean => {
  if (!type) {
    return false;
  }

  if (
    type.kind === ts.SyntaxKind.NullKeyword ||
    (ts.isLiteralTypeNode(type) &&
      type.literal.kind === ts.SyntaxKind.NullKeyword)
  ) {
    return true;
  }

  return ts.isUnionTypeNode(type) && type.types.some(typeContainsNull);
};

const typeContainsUndefined = (type: ts.TypeNode | undefined): boolean => {
  if (!type) {
    return false;
  }

  if (type.kind === ts.SyntaxKind.UndefinedKeyword) {
    return true;
  }

  return ts.isUnionTypeNode(type) && type.types.some(typeContainsUndefined);
};

const isUndefinedOnlyDefaultCandidate = (parameter: ts.ParameterDeclaration) =>
  !typeContainsNull(parameter.type) &&
  (Boolean(parameter.questionToken) || typeContainsUndefined(parameter.type));

export const js003DefaultParameterDetector: Detector = {
  dependencyScope: "source-file",
  id: "default-parameter-normalization",
  languages: ["ts", "tsx"],
  ruleId: "JS-003",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    visit(context.sourceFile, (node) => {
      if (!isExecutableFunction(node) || !node.body || !ts.isBlock(node.body)) {
        return;
      }

      const parameters = new Map(
        node.parameters
          .filter(
            (parameter) =>
              ts.isIdentifier(parameter.name) &&
              !parameter.initializer &&
              isUndefinedOnlyDefaultCandidate(parameter),
          )
          .map((parameter) => [
            (parameter.name as ts.Identifier).text,
            parameter,
          ]),
      );

      if (!parameters.size) {
        return;
      }

      for (const statement of node.body.statements) {
        if (
          !ts.isExpressionStatement(statement) ||
          !ts.isBinaryExpression(statement.expression)
        ) {
          continue;
        }

        const assignment = statement.expression;
        if (
          assignment.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
          !ts.isIdentifier(assignment.left) ||
          !parameters.has(assignment.left.text) ||
          !ts.isBinaryExpression(assignment.right) ||
          assignment.right.operatorToken.kind !==
            ts.SyntaxKind.QuestionQuestionToken ||
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

export const js003Detectors = [
  js003DefaultParameterDetector,
] satisfies readonly Detector[];
