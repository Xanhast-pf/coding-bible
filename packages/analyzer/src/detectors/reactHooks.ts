import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import type { ExecutableFunction } from "../utils.ts";
import {
  createFinding,
  getFunctionName,
  isExecutableFunction,
  visit,
} from "../utils.ts";

const isHookCall = (node: ts.CallExpression) =>
  ts.isIdentifier(node.expression) &&
  (node.expression.text === "use" || /^use[A-Z0-9]/.test(node.expression.text));

const isAllowedHookFunction = (node: ExecutableFunction) => {
  const name = getFunctionName(node);
  return Boolean(name && (/^[A-Z]/.test(name) || /^use[A-Z0-9]/.test(name)));
};

const getNearestFunction = (node: ts.Node) => {
  let current = node.parent;

  while (current) {
    if (isExecutableFunction(current)) {
      return current;
    }
    current = current.parent;
  }

  return null;
};

const hasForbiddenControlFlow = (
  node: ts.Node,
  boundary: ExecutableFunction,
  allowConditionalUse: boolean,
) => {
  let current = node.parent;

  while (current && current !== boundary) {
    const isTryBoundary =
      ts.isTryStatement(current) || ts.isCatchClause(current);
    const isConditionalBoundary =
      ts.isIfStatement(current) ||
      ts.isConditionalExpression(current) ||
      ts.isForStatement(current) ||
      ts.isForInStatement(current) ||
      ts.isForOfStatement(current) ||
      ts.isWhileStatement(current) ||
      ts.isDoStatement(current) ||
      ts.isSwitchStatement(current);

    if (isTryBoundary || (!allowConditionalUse && isConditionalBoundary)) {
      return true;
    }

    current = current.parent;
  }

  return false;
};

const isAsyncFunction = (node: ExecutableFunction) =>
  Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword));

export const reactHookPlacementDetector: Detector = {
  id: "react-hook-placement",
  ruleId: "REACT-009",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    visit(context.sourceFile, (node) => {
      if (!ts.isCallExpression(node) || !isHookCall(node)) {
        return;
      }

      const boundary = getNearestFunction(node);
      const hookName = ts.isIdentifier(node.expression) ? node.expression.text : "Hook";

      if (!boundary || !isAllowedHookFunction(boundary)) {
        findings.push(
          createFinding(context, node, {
            detectorId: "react-hook-placement",
            message: `\`${hookName}\` is called outside a React component or custom Hook.`,
            ruleId: "REACT-009",
            suggestion:
              "Call Hooks only at the top level of a component or a custom Hook named with the `use` prefix.",
          }),
        );
        return;
      }

      if (isAsyncFunction(boundary)) {
        findings.push(
          createFinding(context, node, {
            detectorId: "react-hook-placement",
            message: `\`${hookName}\` is called from an async component or custom Hook.`,
            ruleId: "REACT-009",
            suggestion: "Hooks must run from a synchronous component or custom Hook call path.",
          }),
        );
        return;
      }

      if (hasForbiddenControlFlow(node, boundary, hookName === "use")) {
        findings.push(
          createFinding(context, node, {
            detectorId: "react-hook-placement",
            message: `\`${hookName}\` is called conditionally or inside control flow.`,
            ruleId: "REACT-009",
            suggestion:
              "Move the Hook to the top level so React observes the same Hook order on every render.",
          }),
        );
      }
    });

    return findings;
  },
};
