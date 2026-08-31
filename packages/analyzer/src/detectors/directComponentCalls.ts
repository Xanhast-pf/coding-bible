import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import {
  createFinding,
  getFunctionName,
  getSymbol,
  isExecutableFunction,
  isPascalCaseName,
  nodesOfKind,
} from "../utils.ts";

const containsJsx = (root: ts.Node) => {
  let found = false;

  const walk = (node: ts.Node) => {
    if (found) {
      return;
    }

    if (node !== root && isExecutableFunction(node)) {
      return;
    }

    if (
      ts.isJsxElement(node) ||
      ts.isJsxSelfClosingElement(node) ||
      ts.isJsxFragment(node)
    ) {
      found = true;
      return;
    }

    node.forEachChild(walk);
  };

  walk(root);
  return found;
};

export const directComponentCallsDetector: Detector = {
  dependencyScope: "source-file",
  id: "react-direct-component-call",
  languages: ["jsx", "tsx"],
  ruleId: "REACT-010",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];
    const componentSymbols = new Set<ts.Symbol>();

    for (const node of nodesOfKind<ts.FunctionDeclaration>(
      context,
      ts.SyntaxKind.FunctionDeclaration,
    )) {
      if (
        !node.body ||
        !node.name ||
        !isPascalCaseName(node.name.text) ||
        !containsJsx(node.body)
      ) {
        continue;
      }

      const symbol = getSymbol(context, node.name);
      if (symbol) {
        componentSymbols.add(symbol);
      }
    }

    for (const node of [
      ...nodesOfKind<ts.ArrowFunction>(context, ts.SyntaxKind.ArrowFunction),
      ...nodesOfKind<ts.FunctionExpression>(
        context,
        ts.SyntaxKind.FunctionExpression,
      ),
    ]) {
      if (!isExecutableFunction(node) || !node.body) {
        continue;
      }

      const name = getFunctionName(node);
      const declaration = node.parent;
      if (
        !name ||
        !isPascalCaseName(name) ||
        !containsJsx(node.body) ||
        !ts.isVariableDeclaration(declaration) ||
        !ts.isIdentifier(declaration.name)
      ) {
        continue;
      }

      const symbol = getSymbol(context, declaration.name);
      if (symbol) {
        componentSymbols.add(symbol);
      }
    }

    if (!componentSymbols.size) {
      return findings;
    }

    for (const node of nodesOfKind<ts.CallExpression>(
      context,
      ts.SyntaxKind.CallExpression,
    )) {
      if (!ts.isIdentifier(node.expression)) {
        continue;
      }

      const symbol = getSymbol(context, node.expression);
      if (!symbol || !componentSymbols.has(symbol)) {
        continue;
      }

      findings.push(
        createFinding(context, node, {
          detectorId: "react-direct-component-call",
          message: `\`${node.expression.text}\` is a local React component being invoked like a regular function.`,
          ruleId: "REACT-010",
          suggestion: `Render it through JSX instead: \`<${node.expression.text} ... />\`.`,
        }),
      );
    }

    return findings;
  },
};
