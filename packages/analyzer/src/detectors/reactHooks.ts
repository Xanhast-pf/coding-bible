import ts from "typescript";

import type { AnalyzerFinding, Detector, DetectorContext } from "../types.ts";
import type { ExecutableFunction } from "../utils.ts";
import {
  createFinding,
  getFunctionName,
  getImportBinding,
  hasSourceFileDeclaration,
  isExecutableFunction,
  nodesOfKind,
} from "../utils.ts";

const hookNamePattern = /^use[A-Z0-9]/;

const isLegendModule = (moduleName: string) =>
  moduleName.startsWith("@legendapp/state");

const isReactModule = (moduleName: string) => moduleName === "react";

const getReactHookName = (
  context: DetectorContext,
  expression: ts.LeftHandSideExpression,
): string | null => {
  if (ts.isIdentifier(expression)) {
    const binding = getImportBinding(context, expression);
    if (binding?.moduleName === "react" && binding.kind === "named") {
      return binding.importedName === "use" ||
        hookNamePattern.test(binding.importedName)
        ? binding.importedName
        : null;
    }

    return expression.text === "use" || hookNamePattern.test(expression.text)
      ? expression.text
      : null;
  }

  if (
    !ts.isPropertyAccessExpression(expression) ||
    !ts.isIdentifier(expression.expression)
  ) {
    return null;
  }

  const binding = getImportBinding(context, expression.expression);
  if (
    binding?.moduleName === "react" &&
    (binding.kind === "default" || binding.kind === "namespace") &&
    (expression.name.text === "use" ||
      hookNamePattern.test(expression.name.text))
  ) {
    return expression.name.text;
  }

  return null;
};

const isBareUnshadowedIdentifier = (
  context: DetectorContext,
  expression: ts.LeftHandSideExpression,
  name: string,
) =>
  ts.isIdentifier(expression) &&
  expression.text === name &&
  !hasSourceFileDeclaration(context, expression);

const isImportedCallTarget = (
  context: DetectorContext,
  expression: ts.LeftHandSideExpression,
  importedName: string,
  matchesModule: (moduleName: string) => boolean,
) => {
  if (ts.isIdentifier(expression)) {
    const binding = getImportBinding(context, expression);
    return Boolean(
      binding &&
      matchesModule(binding.moduleName) &&
      binding.importedName === importedName,
    );
  }

  if (
    !ts.isPropertyAccessExpression(expression) ||
    !ts.isIdentifier(expression.expression) ||
    expression.name.text !== importedName
  ) {
    return false;
  }

  const binding = getImportBinding(context, expression.expression);
  return Boolean(
    binding &&
    matchesModule(binding.moduleName) &&
    (binding.kind === "default" || binding.kind === "namespace"),
  );
};

const isComponentWrapperCall = (
  context: DetectorContext,
  call: ts.CallExpression,
) =>
  isImportedCallTarget(context, call.expression, "memo", isReactModule) ||
  isImportedCallTarget(context, call.expression, "forwardRef", isReactModule) ||
  isImportedCallTarget(context, call.expression, "observer", isLegendModule) ||
  isBareUnshadowedIdentifier(context, call.expression, "observer");

const isHookHarnessCall = (
  context: DetectorContext,
  call: ts.CallExpression,
) => {
  if (ts.isIdentifier(call.expression)) {
    const binding = getImportBinding(context, call.expression);
    if (binding) {
      return binding.importedName === "renderHook";
    }
  }

  return isBareUnshadowedIdentifier(context, call.expression, "renderHook");
};

const isDirectCallArgument = (
  node: ExecutableFunction,
  call: ts.CallExpression,
) => call.arguments.some((argument) => argument === node);

const isRecognizedRenderBoundary = (
  context: DetectorContext,
  node: ExecutableFunction,
) => {
  const parent = node.parent;
  return Boolean(
    ts.isCallExpression(parent) &&
    isDirectCallArgument(node, parent) &&
    (isComponentWrapperCall(context, parent) ||
      isHookHarnessCall(context, parent)),
  );
};

const isAllowedHookFunction = (
  context: DetectorContext,
  node: ExecutableFunction,
) => {
  const name = getFunctionName(node);
  return Boolean(
    (name && (/^[A-Z]/.test(name) || hookNamePattern.test(name))) ||
    isRecognizedRenderBoundary(context, node),
  );
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

const isShortCircuitOperator = (kind: ts.SyntaxKind) =>
  kind === ts.SyntaxKind.AmpersandAmpersandToken ||
  kind === ts.SyntaxKind.BarBarToken ||
  kind === ts.SyntaxKind.QuestionQuestionToken ||
  kind === ts.SyntaxKind.AmpersandAmpersandEqualsToken ||
  kind === ts.SyntaxKind.BarBarEqualsToken ||
  kind === ts.SyntaxKind.QuestionQuestionEqualsToken;

const isConditionallyEvaluatedByParent = (child: ts.Node, parent: ts.Node) => {
  if (ts.isIfStatement(parent)) {
    return child !== parent.expression;
  }

  if (ts.isConditionalExpression(parent)) {
    return child !== parent.condition;
  }

  if (
    ts.isBinaryExpression(parent) &&
    isShortCircuitOperator(parent.operatorToken.kind)
  ) {
    return child !== parent.left;
  }

  if (ts.isSwitchStatement(parent)) {
    return child !== parent.expression;
  }

  if (ts.isForStatement(parent)) {
    return child !== parent.initializer;
  }

  if (ts.isForInStatement(parent) || ts.isForOfStatement(parent)) {
    return child !== parent.expression;
  }

  return ts.isWhileStatement(parent) || ts.isDoStatement(parent);
};

const hasForbiddenControlFlow = (
  node: ts.Node,
  boundary: ExecutableFunction,
  allowConditionalUse: boolean,
) => {
  let child: ts.Node = node;
  let current = node.parent;

  while (current && current !== boundary) {
    if (ts.isTryStatement(current) || ts.isCatchClause(current)) {
      return true;
    }

    if (
      !allowConditionalUse &&
      isConditionallyEvaluatedByParent(child, current)
    ) {
      return true;
    }

    child = current;
    current = current.parent;
  }

  return false;
};

const statementContainsPotentialEarlyReturn = (statement: ts.Statement) => {
  if (ts.isFunctionDeclaration(statement) || ts.isReturnStatement(statement)) {
    return false;
  }

  let returns = false;

  const walk = (node: ts.Node) => {
    if (returns) {
      return;
    }

    if (node !== statement && isExecutableFunction(node)) {
      return;
    }

    if (ts.isReturnStatement(node)) {
      returns = true;
      return;
    }

    node.forEachChild(walk);
  };

  walk(statement);
  return returns;
};

const isAfterPotentialEarlyExit = (
  node: ts.Node,
  boundary: ExecutableFunction,
) => {
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
    .some(statementContainsPotentialEarlyReturn);
};

const isAsyncFunction = (node: ExecutableFunction) =>
  Boolean(
    node.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword,
    ),
  );

export const reactHookPlacementDetector: Detector = {
  dependencyScope: "source-file",
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
      if (!boundary || !isAllowedHookFunction(context, boundary)) {
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
            suggestion:
              "Hooks must run from a synchronous component or custom Hook call path.",
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
