import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import { createFinding, visit } from "../utils.ts";

const assignmentOperators = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

const collectAssignedNames = (sourceFile: ts.SourceFile) => {
  const names = new Set<string>();

  const collectTargetNames = (target: ts.Node) => {
    if (ts.isIdentifier(target)) {
      names.add(target.text);
      return;
    }

    if (ts.isArrayBindingPattern(target) || ts.isArrayLiteralExpression(target)) {
      for (const element of target.elements) {
        if (ts.isBindingElement(element)) {
          collectTargetNames(element.name);
        } else if (ts.isExpression(element)) {
          collectTargetNames(element);
        }
      }
      return;
    }

    if (ts.isObjectBindingPattern(target)) {
      for (const element of target.elements) {
        collectTargetNames(element.name);
      }
      return;
    }

    if (ts.isObjectLiteralExpression(target)) {
      for (const property of target.properties) {
        if (ts.isShorthandPropertyAssignment(property)) {
          names.add(property.name.text);
        } else if (ts.isPropertyAssignment(property)) {
          collectTargetNames(property.initializer);
        } else if (ts.isSpreadAssignment(property)) {
          collectTargetNames(property.expression);
        }
      }
    }
  };

  visit(sourceFile, (node) => {
    if (ts.isBinaryExpression(node) && assignmentOperators.has(node.operatorToken.kind)) {
      collectTargetNames(node.left);
      return;
    }

    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      (node.operator === ts.SyntaxKind.PlusPlusToken ||
        node.operator === ts.SyntaxKind.MinusMinusToken)
    ) {
      collectTargetNames(node.operand);
      return;
    }

    if (
      (ts.isForInStatement(node) || ts.isForOfStatement(node)) &&
      !ts.isVariableDeclarationList(node.initializer)
    ) {
      collectTargetNames(node.initializer);
    }
  });

  return names;
};

const isLoopInitializer = (node: ts.VariableDeclarationList) => {
  const parent = node.parent;
  return (
    (ts.isForStatement(parent) && parent.initializer === node) ||
    ((ts.isForInStatement(parent) || ts.isForOfStatement(parent)) && parent.initializer === node)
  );
};

export const preferConstDetector: Detector = {
  id: "prefer-const",
  ruleId: "CORE-003",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];
    const assignedNames = collectAssignedNames(context.sourceFile);

    visit(context.sourceFile, (node) => {
      if (
        !ts.isVariableDeclarationList(node) ||
        !(node.flags & ts.NodeFlags.Let) ||
        isLoopInitializer(node)
      ) {
        return;
      }

      for (const declaration of node.declarations) {
        if (
          !declaration.initializer ||
          !ts.isIdentifier(declaration.name) ||
          assignedNames.has(declaration.name.text)
        ) {
          continue;
        }

        findings.push(
          createFinding(context, declaration.name, {
            detectorId: "prefer-const",
            message: `\`${declaration.name.text}\` is declared with \`let\` but is never reassigned.`,
            ruleId: "CORE-003",
            suggestion: "Use `const` so the binding contract is explicit.",
          }),
        );
      }
    });

    return findings;
  },
};
