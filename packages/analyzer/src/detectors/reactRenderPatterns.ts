import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import {
  createFinding,
  getFunctionName,
  isExecutableFunction,
  isPascalCaseName,
  visit,
} from "../utils.ts";

const containsJsx = (node: ts.Node) => {
  let found = false;

  visit(node, (child) => {
    if (
      ts.isJsxElement(child) ||
      ts.isJsxSelfClosingElement(child) ||
      ts.isJsxFragment(child)
    ) {
      found = true;
    }
  });

  return found;
};

const isComponentFunction = (node: ts.Node) => {
  if (!isExecutableFunction(node) || !node.body) {
    return false;
  }

  const name = getFunctionName(node);
  return Boolean(name && isPascalCaseName(name) && containsJsx(node.body));
};

const isStaticExpression = (expression: ts.Expression): boolean => {
  if (
    ts.isStringLiteral(expression) ||
    ts.isNumericLiteral(expression) ||
    expression.kind === ts.SyntaxKind.TrueKeyword ||
    expression.kind === ts.SyntaxKind.FalseKeyword ||
    expression.kind === ts.SyntaxKind.NullKeyword
  ) {
    return true;
  }

  if (ts.isPrefixUnaryExpression(expression)) {
    return isStaticExpression(expression.operand);
  }

  if (ts.isArrayLiteralExpression(expression)) {
    return expression.elements.every(
      (element) => !ts.isSpreadElement(element) && isStaticExpression(element),
    );
  }

  if (ts.isObjectLiteralExpression(expression)) {
    return expression.properties.every(
      (property) =>
        ts.isPropertyAssignment(property) && isStaticExpression(property.initializer),
    );
  }

  return false;
};

export const staticComponentValueDetector: Detector = {
  id: "react-static-component-value",
  ruleId: "REACT-008",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    visit(context.sourceFile, (node) => {
      if (!isComponentFunction(node) || !isExecutableFunction(node) || !node.body) {
        return;
      }

      const inspect = (child: ts.Node) => {
        if (child !== node && isExecutableFunction(child)) {
          return;
        }

        if (
          ts.isVariableDeclaration(child) &&
          ts.isIdentifier(child.name) &&
          child.initializer &&
          (ts.isArrayLiteralExpression(child.initializer) ||
            ts.isObjectLiteralExpression(child.initializer)) &&
          isStaticExpression(child.initializer)
        ) {
          findings.push(
            createFinding(context, child.name, {
              detectorId: "react-static-component-value",
              message: `\`${child.name.text}\` is recreated on every render even though its value is context-free.`,
              ruleId: "REACT-008",
              suggestion: "Move this static array/object to module scope.",
            }),
          );
        }

        child.forEachChild(inspect);
      };

      node.body.forEachChild(inspect);
    });

    return findings;
  },
};

const collectBindingNames = (name: ts.BindingName, names: Set<string>) => {
  if (ts.isIdentifier(name)) {
    names.add(name.text);
    return;
  }

  for (const element of name.elements) {
    if (ts.isBindingElement(element)) {
      collectBindingNames(element.name, names);
    }
  }
};

const getRootIdentifier = (expression: ts.Expression): ts.Identifier | null => {
  if (ts.isIdentifier(expression)) {
    return expression;
  }

  if (ts.isPropertyAccessExpression(expression) || ts.isElementAccessExpression(expression)) {
    return getRootIdentifier(expression.expression);
  }

  return null;
};

const assignmentOperatorKinds = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
]);

export const reactInputMutationDetector: Detector = {
  id: "react-input-mutation",
  ruleId: "REACT-011",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    visit(context.sourceFile, (node) => {
      if (!isComponentFunction(node) || !isExecutableFunction(node) || !node.body) {
        return;
      }

      const inputNames = new Set<string>();
      for (const parameter of node.parameters) {
        collectBindingNames(parameter.name, inputNames);
      }

      if (!inputNames.size) {
        return;
      }

      visit(node.body, (child) => {
        if (
          ts.isBinaryExpression(child) &&
          assignmentOperatorKinds.has(child.operatorToken.kind) &&
          (ts.isPropertyAccessExpression(child.left) || ts.isElementAccessExpression(child.left))
        ) {
          const root = getRootIdentifier(child.left);
          if (root && inputNames.has(root.text)) {
            findings.push(
              createFinding(context, child.left, {
                detectorId: "react-input-mutation",
                message: `\`${root.text}\` comes from component inputs and is mutated during the render lifetime.`,
                ruleId: "REACT-011",
                suggestion: "Derive a new value instead of mutating props or values received through props.",
              }),
            );
          }
        }

        if (
          (ts.isPrefixUnaryExpression(child) || ts.isPostfixUnaryExpression(child)) &&
          (child.operator === ts.SyntaxKind.PlusPlusToken ||
            child.operator === ts.SyntaxKind.MinusMinusToken) &&
          (ts.isPropertyAccessExpression(child.operand) ||
            ts.isElementAccessExpression(child.operand))
        ) {
          const root = getRootIdentifier(child.operand);
          if (root && inputNames.has(root.text)) {
            findings.push(
              createFinding(context, child.operand, {
                detectorId: "react-input-mutation",
                message: `\`${root.text}\` comes from component inputs and is mutated during the render lifetime.`,
                ruleId: "REACT-011",
                suggestion: "Derive a new value instead of mutating props or values received through props.",
              }),
            );
          }
        }
      });
    });

    return findings;
  },
};
