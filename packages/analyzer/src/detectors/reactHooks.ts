import ts from "typescript";

import type { AnalyzerFinding, Detector, DetectorContext } from "../types.ts";
import type { ExecutableFunction } from "../utils.ts";
import {
  createFinding,
  getFunctionName,
  getImportBinding,
  isExecutableFunction,
  nodesOfKind,
} from "../utils.ts";

const hookNamePattern = /^use[A-Z0-9]/;

const getReactHookName = (
  context: DetectorContext,
  expression: ts.LeftHandSideExpression,
): string | null => {
  if (ts.isIdentifier(expression)) {
    const binding = getImportBinding(context, expression);
    if (binding?.moduleName === "react" && binding.kind === "named") {
      return binding.importedName === "use" || hookNamePattern.test(binding.importedName)
        ? binding.importedName
        : null;
    }

    return expression.text === "use" || hookNamePattern.test(expression.text)
      ? expression.text
      : null;
  }

  if (!ts.isPropertyAccessExpression(expression) || !ts.isIdentifier(expression.expression)) {
    return null;
  }

  const binding = getImportBinding(context, expression.expression);
  if (
    binding?.moduleName === "react" &&
    (binding.kind === "default" || binding.kind === "namespace") &&
    (expression.name.text === "use" || hookNamePattern.test(expression.name.text))
  ) {
    return expression.name.text;
  }

  return null;
};

const isAllowedHookFunction = (node: ExecutableFunction) => {
  const name = getFunctionName(node);
  return Boolean(name && (/^[A-Z]/.test(name) || hookNamePattern.test(name)));
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
    const isTryBoundary = ts.isTryStatement(current) || ts.isCatchClause(current);
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

const statementContainsFunctionExit = (statement: ts.Statement) => {
  let exits = false;

  const walk = (node: ts.Node) => {
    if (exits) {
      return;
    }

    if (node !== statement && isExecutableFunction(node)) {
      return;
    }

    if (ts.isReturnStatement(node) || ts.isThrowStatement(node)) {
      exits = true;
      return;
    }

    node.forEachChild(walk);
  };

  walk(statement);
  return exits;
};

const isAfterPotentialEarlyExit = (node: ts.Node, boundary: ExecutableFunction) => {
  if (!boundary.body || !ts.isBlock(boundary.body)) {
    return false;
  }

  let current: ts.Node = node;
  while (current.parent && current.parent !== boundary.body) {
    current = current.parent;
  }

  if (!ts.isStatement(current)) {
    return false;
  }

  const statementIndex = boundary.body.statements.indexOf(current);
  return boundary.body.statements
    .slice(0, Math.max(statementIndex, 0))
    .some(statementContainsFunctionExit);
};

const isAsyncFunction = (node: ExecutableFunction) =>
  Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword));

export const reactHookPlacementDetector: Detector = {
  id: "react-hook-placement",
  ruleId: "REACT-009",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    for (const node of nodesOfKind<ts.CallExpression>(
      context,
      ts.SyntaxKind.CallExpression,
    )) {
      const hookName = getReactHookName(context, node.expression);
      if (!hookName) {
        continue;
      }

      const boundary = getNearestFunction(node);
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
        continue;
      }

      if (isAsyncFunction(boundary) && hookName !== "use") {
        findings.push(
          createFinding(context, node, {
            detectorId: "react-hook-placement",
            message: `\`${hookName}\` is called from an async component or custom Hook.`,
            ruleId: "REACT-009",
            suggestion: "Hooks must run from a synchronous component or custom Hook call path.",
          }),
        );
        continue;
      }

      const allowConditionalUse = hookName === "use";
      if (
        hasForbiddenControlFlow(node, boundary, allowConditionalUse) ||
        (!allowConditionalUse && isAfterPotentialEarlyExit(node, boundary))
      ) {
        findings.push(
          createFinding(context, node, {
            detectorId: "react-hook-placement",
            message: `\`${hookName}\` is called conditionally or after a path that may exit early.`,
            ruleId: "REACT-009",
            suggestion:
              "Move the Hook to the top level so React observes the same Hook order on every render.",
          }),
        );
      }
    }

    return findings;
  },
};
