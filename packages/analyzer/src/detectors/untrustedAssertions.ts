import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import { createFinding, unwrapExpression, visit } from "../utils.ts";

const isExternalDataRead = (expression: ts.Expression) => {
  const candidate = unwrapExpression(expression);

  if (!ts.isCallExpression(candidate)) {
    return false;
  }

  const callee = candidate.expression;
  if (!ts.isPropertyAccessExpression(callee)) {
    return false;
  }

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

  if (
    ts.isIdentifier(callee.expression) &&
    ["localStorage", "sessionStorage"].includes(callee.expression.text) &&
    callee.name.text === "getItem"
  ) {
    return true;
  }

  return false;
};

export const untrustedAssertionsDetector: Detector = {
  id: "untrusted-data-assertion",
  ruleId: "TS-004",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    visit(context.sourceFile, (node) => {
      if (!ts.isAsExpression(node) && !ts.isTypeAssertionExpression(node)) {
        return;
      }

      if (!isExternalDataRead(node.expression)) {
        return;
      }

      findings.push(
        createFinding(context, node, {
          detectorId: "untrusted-data-assertion",
          message: "External runtime data is being trusted through a type assertion.",
          ruleId: "TS-004",
          suggestion:
            "Keep the value `unknown`, validate it at the boundary, then return the validated domain type.",
        }),
      );
    });

    return findings;
  },
};
