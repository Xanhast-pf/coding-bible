import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../../types.ts";
import { createFinding } from "../../utils.ts";

const dataCallName = /^(?:fetch|get|load|query|request)[A-Z0-9_]/i;

const getAwaitedCall = (statement: ts.Statement) => {
  if (!ts.isVariableStatement(statement)) return null;
  if (statement.declarationList.declarations.length !== 1) return null;
  const declaration = statement.declarationList.declarations[0];
  if (!declaration || !ts.isIdentifier(declaration.name)) return null;
  const initializer = declaration.initializer;
  if (!initializer || !ts.isAwaitExpression(initializer)) return null;
  if (!ts.isCallExpression(initializer.expression)) return null;
  return { declaration, call: initializer.expression };
};

const getCallName = (call: ts.CallExpression) => {
  const expression = call.expression;
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return null;
};

const usesSymbol = (
  context: Parameters<Detector["analyze"]>[0],
  node: ts.Node,
  symbol: ts.Symbol,
) => {
  let used = false;
  const visit = (candidate: ts.Node): void => {
    if (used) return;
    if (
      ts.isIdentifier(candidate) &&
      context.checker.getSymbolAtLocation(candidate) === symbol
    ) {
      used = true;
      return;
    }
    ts.forEachChild(candidate, visit);
  };
  visit(node);
  return used;
};

const detector: Detector = {
  dependencyScope: "source-file",
  id: "next_006-independent-sequential-data-awaits",
  ruleId: "NEXT-006",
  languages: ["ts", "tsx", "js", "jsx"],
  profile: {
    confidence: "strong",
    impact: "medium",
  },
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];
    const inspectStatements = (statements: readonly ts.Statement[]) => {
      for (let index = 0; index < statements.length - 1; index += 1) {
        const firstStatement = statements[index];
        const secondStatement = statements[index + 1];
        if (!firstStatement || !secondStatement) continue;
        const first = getAwaitedCall(firstStatement);
        const second = getAwaitedCall(secondStatement);
        if (!first || !second) continue;

        const firstName = getCallName(first.call);
        const secondName = getCallName(second.call);
        if (!firstName || !secondName) continue;
        if (!dataCallName.test(firstName) || !dataCallName.test(secondName))
          continue;

        const symbol = context.checker.getSymbolAtLocation(
          first.declaration.name,
        );
        if (symbol && usesSymbol(context, second.call, symbol)) continue;

        findings.push(
          createFinding(context, second.call, {
            detectorId: "next_006-independent-sequential-data-awaits",
            ruleId: "NEXT-006",
            message:
              "Two adjacent data-like requests are awaited sequentially even though the second does not depend on the first result.",
            suggestion:
              "Start independent requests together, for example with Promise.all, when their ordering is not required.",
          }),
        );
      }
    };

    const visit = (node: ts.Node): void => {
      if (ts.isSourceFile(node) || ts.isBlock(node))
        inspectStatements(node.statements);
      ts.forEachChild(node, visit);
    };
    visit(context.sourceFile);
    return findings;
  },
};

export const next006Detectors = [detector];
