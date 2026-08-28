import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import { createFinding, isExecutableFunction } from "../utils.ts";

const visitRenderBody = (node: ts.Node, root: ts.Node, visitor: (node: ts.Node) => void) => {
  visitor(node);

  node.forEachChild((child) => {
    if (child !== root && isExecutableFunction(child)) {
      return;
    }
    visitRenderBody(child, root, visitor);
  });
};

export const legendReactSubscriptionDetector: Detector = {
  id: "legend-react-use-value",
  ruleId: "LEGEND-001",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    context.sourceFile.forEachChild(function walk(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "observer"
      ) {
        const render = node.arguments[0];
        if (render && (ts.isArrowFunction(render) || ts.isFunctionExpression(render))) {
          visitRenderBody(render.body, render, (child) => {
            if (
              !ts.isCallExpression(child) ||
              !ts.isPropertyAccessExpression(child.expression) ||
              child.expression.name.text !== "get" ||
              !child.expression.expression.getText(context.sourceFile).includes("$")
            ) {
              return;
            }

            findings.push(
              createFinding(context, child, {
                detectorId: "legend-react-use-value",
                message: "A Legend-State observable is read with `get()` inside an `observer` render.",
                ruleId: "LEGEND-001",
                suggestion: "Read the observable with `useValue(...)` in new React code.",
              }),
            );
          });
        }
      }

      node.forEachChild(walk);
    });

    return findings;
  },
};
