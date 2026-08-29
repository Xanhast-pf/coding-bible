import ts from "typescript";

import type { AnalyzerFinding, Detector, DetectorContext } from "../types.ts";
import { createFinding, getReferences, getSymbol, nodesOfKind } from "../utils.ts";

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

const collectBindingIdentifiers = (name: ts.BindingName): ts.Identifier[] => {
  if (ts.isIdentifier(name)) {
    return [name];
  }

  return name.elements.flatMap((element) =>
    ts.isBindingElement(element) ? collectBindingIdentifiers(element.name) : [],
  );
};

const containsNode = (ancestor: ts.Node, candidate: ts.Node) =>
  candidate.pos >= ancestor.pos && candidate.end <= ancestor.end;

const isWriteReference = (identifier: ts.Identifier) => {
  let current: ts.Node = identifier;

  while (current.parent) {
    const parent = current.parent;

    if (
      ts.isBinaryExpression(parent) &&
      assignmentOperators.has(parent.operatorToken.kind) &&
      containsNode(parent.left, identifier)
    ) {
      return true;
    }

    if (
      (ts.isPrefixUnaryExpression(parent) || ts.isPostfixUnaryExpression(parent)) &&
      (parent.operator === ts.SyntaxKind.PlusPlusToken ||
        parent.operator === ts.SyntaxKind.MinusMinusToken) &&
      containsNode(parent.operand, identifier)
    ) {
      return true;
    }

    if (
      (ts.isForInStatement(parent) || ts.isForOfStatement(parent)) &&
      !ts.isVariableDeclarationList(parent.initializer) &&
      containsNode(parent.initializer, identifier)
    ) {
      return true;
    }

    if (
      ts.isStatement(parent) ||
      ts.isVariableDeclaration(parent) ||
      ts.isParameter(parent)
    ) {
      return false;
    }

    current = parent;
  }

  return false;
};

const isReassigned = (context: DetectorContext, identifier: ts.Identifier) => {
  const symbol = getSymbol(context, identifier);
  if (!symbol) {
    return true;
  }

  return getReferences(context, identifier).some(
    (reference) => reference !== identifier && isWriteReference(reference),
  );
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

    for (const node of nodesOfKind<ts.VariableDeclarationList>(
      context,
      ts.SyntaxKind.VariableDeclarationList,
    )) {
      if (!(node.flags & ts.NodeFlags.Let) || isLoopInitializer(node)) {
        continue;
      }

      const initializedBindings = node.declarations.flatMap((declaration) =>
        declaration.initializer ? collectBindingIdentifiers(declaration.name) : [],
      );

      if (
        !initializedBindings.length ||
        initializedBindings.some((identifier) => isReassigned(context, identifier))
      ) {
        continue;
      }

      for (const identifier of initializedBindings) {
        findings.push(
          createFinding(context, identifier, {
            detectorId: "prefer-const",
            message: `\`${identifier.text}\` is declared with \`let\` but is never reassigned.`,
            ruleId: "CORE-003",
            suggestion: "Use `const` so the binding contract is explicit.",
          }),
        );
      }
    }

    return findings;
  },
};
