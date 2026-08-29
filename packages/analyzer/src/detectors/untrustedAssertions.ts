import ts from "typescript";

import type { AnalyzerFinding, Detector, DetectorContext } from "../types.ts";
import {
  createFinding,
  getSymbol,
  nodesOfKind,
  unwrapExpression,
} from "../utils.ts";

const isExternalDataRead = (expression: ts.Expression) => {
  const candidate = unwrapExpression(expression);

  if (
    !ts.isCallExpression(candidate) ||
    !ts.isPropertyAccessExpression(candidate.expression)
  ) {
    return false;
  }

  const callee = candidate.expression;
  if (callee.name.text === "json") {
    return true;
  }

  if (
    ts.isIdentifier(callee.expression) &&
    callee.expression.text === "JSON" &&
    callee.name.text === "parse"
  ) {
    return true;
  }

  return (
    ts.isIdentifier(callee.expression) &&
    (callee.expression.text === "localStorage" ||
      callee.expression.text === "sessionStorage") &&
    callee.name.text === "getItem"
  );
};

const isUnknownAssertion = (node: ts.AsExpression | ts.TypeAssertion) =>
  node.type.kind === ts.SyntaxKind.UnknownKeyword;

const getRootIdentifier = (expression: ts.Expression): ts.Identifier | null => {
  const candidate = unwrapExpression(expression);

  if (ts.isIdentifier(candidate)) {
    return candidate;
  }

  if (
    ts.isPropertyAccessExpression(candidate) ||
    ts.isElementAccessExpression(candidate)
  ) {
    return getRootIdentifier(candidate.expression);
  }

  return null;
};

const getTaintedSymbol = (
  context: DetectorContext,
  expression: ts.Expression,
  taintedSymbols: ReadonlySet<ts.Symbol>,
) => {
  const candidate = unwrapExpression(expression);

  if (isExternalDataRead(candidate)) {
    return true;
  }

  const root = getRootIdentifier(candidate);
  if (root) {
    const symbol = getSymbol(context, root);
    return Boolean(symbol && taintedSymbols.has(symbol));
  }

  return false;
};

const collectTaintedSymbols = (context: DetectorContext) => {
  const taintedSymbols = new Set<ts.Symbol>();
  const declarations = nodesOfKind<ts.VariableDeclaration>(
    context,
    ts.SyntaxKind.VariableDeclaration,
  );
  let changed = true;

  while (changed) {
    changed = false;

    for (const declaration of declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
        continue;
      }

      const symbol = getSymbol(context, declaration.name);
      if (
        !symbol ||
        taintedSymbols.has(symbol) ||
        !getTaintedSymbol(context, declaration.initializer, taintedSymbols)
      ) {
        continue;
      }

      taintedSymbols.add(symbol);
      changed = true;
    }
  }

  return taintedSymbols;
};

export const untrustedAssertionsDetector: Detector = {
  id: "untrusted-data-assertion",
  languages: ["ts", "tsx"],
  ruleId: "TS-004",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];
    const taintedSymbols = collectTaintedSymbols(context);
    const assertions = [
      ...nodesOfKind<ts.AsExpression>(context, ts.SyntaxKind.AsExpression),
      ...nodesOfKind<ts.TypeAssertion>(
        context,
        ts.SyntaxKind.TypeAssertionExpression,
      ),
    ];

    for (const node of assertions) {
      if (
        isUnknownAssertion(node) ||
        !getTaintedSymbol(context, node.expression, taintedSymbols)
      ) {
        continue;
      }

      findings.push(
        createFinding(context, node, {
          detectorId: "untrusted-data-assertion",
          message:
            "External runtime data is being trusted through a type assertion.",
          ruleId: "TS-004",
          suggestion:
            "Keep the value `unknown`, validate it at the boundary, then return the validated domain type.",
        }),
      );
    }

    return findings;
  },
};
