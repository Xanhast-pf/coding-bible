import ts from "typescript";

import type {
  AnalyzerFinding,
  Detector,
  DetectorContext,
} from "../../types.ts";
import {
  createFinding,
  getImportBinding,
  getSymbol,
  isExecutableFunction,
  type ExecutableFunction,
  unwrapExpression,
  visit,
} from "../../utils.ts";
import {
  isComponentFunction,
  mutatingCollectionMethods,
} from "./_componentFunctions.ts";

const collectBindingIdentifiers = (name: ts.BindingName): ts.Identifier[] => {
  if (ts.isIdentifier(name)) {
    return [name];
  }

  return name.elements.flatMap((element) =>
    ts.isBindingElement(element) ? collectBindingIdentifiers(element.name) : [],
  );
};

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

const isReactStateHook = (
  context: DetectorContext,
  expression: ts.LeftHandSideExpression,
) => {
  if (ts.isIdentifier(expression)) {
    const binding = getImportBinding(context, expression);
    return (
      Boolean(
        binding?.moduleName === "react" &&
        binding.kind === "named" &&
        (binding.importedName === "useState" ||
          binding.importedName === "useReducer"),
      ) ||
      expression.text === "useState" ||
      expression.text === "useReducer"
    );
  }

  if (
    !ts.isPropertyAccessExpression(expression) ||
    !ts.isIdentifier(expression.expression)
  ) {
    return false;
  }

  const binding = getImportBinding(context, expression.expression);
  return Boolean(
    binding?.moduleName === "react" &&
    (binding.kind === "default" || binding.kind === "namespace") &&
    (expression.name.text === "useState" ||
      expression.name.text === "useReducer"),
  );
};

const collectProtectedSymbols = (
  context: DetectorContext,
  component: ExecutableFunction,
) => {
  const protectedSymbols = new Set<ts.Symbol>();

  for (const parameter of component.parameters) {
    for (const identifier of collectBindingIdentifiers(parameter.name)) {
      const symbol = getSymbol(context, identifier);
      if (symbol) {
        protectedSymbols.add(symbol);
      }
    }
  }

  if (!component.body) {
    return protectedSymbols;
  }

  const declarations: ts.VariableDeclaration[] = [];
  visit(component.body, (node) => {
    if (ts.isVariableDeclaration(node)) {
      declarations.push(node);
    }
  });

  for (const declaration of declarations) {
    if (
      !ts.isArrayBindingPattern(declaration.name) ||
      !declaration.initializer ||
      !ts.isCallExpression(declaration.initializer) ||
      !isReactStateHook(context, declaration.initializer.expression)
    ) {
      continue;
    }

    const stateElement = declaration.name.elements[0];
    if (!stateElement || !ts.isBindingElement(stateElement)) {
      continue;
    }

    for (const identifier of collectBindingIdentifiers(stateElement.name)) {
      const symbol = getSymbol(context, identifier);
      if (symbol) {
        protectedSymbols.add(symbol);
      }
    }
  }

  let changed = true;
  while (changed) {
    changed = false;

    for (const declaration of declarations) {
      if (!declaration.initializer) {
        continue;
      }

      const root = getRootIdentifier(declaration.initializer);
      const rootSymbol = root ? getSymbol(context, root) : null;
      if (!rootSymbol || !protectedSymbols.has(rootSymbol)) {
        continue;
      }

      for (const identifier of collectBindingIdentifiers(declaration.name)) {
        const symbol = getSymbol(context, identifier);
        if (symbol && !protectedSymbols.has(symbol)) {
          protectedSymbols.add(symbol);
          changed = true;
        }
      }
    }
  }

  return protectedSymbols;
};

const refLikeIdentifierPattern = /(?:Refs?$|^ref(?:[A-Z_]|$))/;

const isRefCurrentMutation = (target: ts.Expression) => {
  const root = getRootIdentifier(target);
  if (!root || !refLikeIdentifierPattern.test(root.text)) {
    return false;
  }

  let current: ts.Expression = target;
  while (
    ts.isPropertyAccessExpression(current) ||
    ts.isElementAccessExpression(current)
  ) {
    if (
      ts.isPropertyAccessExpression(current) &&
      current.name.text === "current"
    ) {
      return true;
    }

    current = current.expression;
  }

  return false;
};

const assignmentOperatorKinds = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
]);

export const react011InputMutationDetector: Detector = {
  dependencyScope: "source-file",
  id: "react-input-mutation",
  languages: ["js", "jsx", "tsx"],
  ruleId: "REACT-011",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    visit(context.sourceFile, (node) => {
      if (
        !isComponentFunction(node) ||
        !isExecutableFunction(node) ||
        !node.body
      ) {
        return;
      }

      const protectedSymbols = collectProtectedSymbols(context, node);
      if (!protectedSymbols.size) {
        return;
      }

      visit(node.body, (child) => {
        const report = (target: ts.Expression) => {
          if (isRefCurrentMutation(target)) {
            return;
          }

          const root = getRootIdentifier(target);
          const symbol = root ? getSymbol(context, root) : null;
          if (!root || !symbol || !protectedSymbols.has(symbol)) {
            return;
          }

          findings.push(
            createFinding(context, target, {
              detectorId: "react-input-mutation",
              message: `\`${root.text}\` aliases React input/state and is mutated directly.`,
              ruleId: "REACT-011",
              suggestion:
                "Derive a new value or use the state setter instead of mutating React-owned snapshots.",
            }),
          );
        };

        if (
          ts.isBinaryExpression(child) &&
          assignmentOperatorKinds.has(child.operatorToken.kind) &&
          (ts.isPropertyAccessExpression(child.left) ||
            ts.isElementAccessExpression(child.left))
        ) {
          report(child.left);
        }

        if (
          (ts.isPrefixUnaryExpression(child) ||
            ts.isPostfixUnaryExpression(child)) &&
          (child.operator === ts.SyntaxKind.PlusPlusToken ||
            child.operator === ts.SyntaxKind.MinusMinusToken) &&
          (ts.isPropertyAccessExpression(child.operand) ||
            ts.isElementAccessExpression(child.operand))
        ) {
          report(child.operand);
        }

        if (
          ts.isCallExpression(child) &&
          ts.isPropertyAccessExpression(child.expression) &&
          mutatingCollectionMethods.has(child.expression.name.text)
        ) {
          report(child.expression.expression);
        }
      });
    });

    return findings;
  },
};

export const react011Detectors = [
  react011InputMutationDetector,
] satisfies readonly Detector[];
