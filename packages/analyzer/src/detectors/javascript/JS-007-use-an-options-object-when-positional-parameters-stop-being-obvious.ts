import ts from "typescript";

import type { Detector } from "../../types.ts";
import { createFinding, nodesOfKind } from "../../utils.ts";

const isPrimitiveLiteral = (node: ts.Expression) =>
  ts.isStringLiteralLike(node) ||
  ts.isNumericLiteral(node) ||
  node.kind === ts.SyntaxKind.TrueKeyword ||
  node.kind === ts.SyntaxKind.FalseKeyword;

const detector: Detector = {
  dependencyScope: "source-file",
  id: "js_007-long-positional-call",
  ruleId: "JS-007",
  languages: ["ts", "tsx", "js", "jsx"],
  profile: {
    confidence: "strong",
    impact: "low",
  },
  analyze: (context) =>
    nodesOfKind<ts.CallExpression>(context, ts.SyntaxKind.CallExpression)
      .filter((node) => {
        if (!ts.isIdentifier(node.expression)) return false;
        if (node.arguments.length < 5) return false;
        if (node.arguments.some(ts.isSpreadElement)) return false;
        return node.arguments.filter(isPrimitiveLiteral).length >= 3;
      })
      .map((node) =>
        createFinding(context, node, {
          detectorId: "js_007-long-positional-call",
          ruleId: "JS-007",
          message:
            "This call passes five or more positional arguments with several literal values.",
          suggestion:
            "Consider an options object so the call site names values and can evolve safely.",
        }),
      ),
};

export const js007Detectors = [detector];
