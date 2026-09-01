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
  hasSourceFileDeclaration,
  nodesOfKind,
} from "../../utils.ts";

const isReactHookCall = (
  context: DetectorContext,
  call: ts.CallExpression,
  hookName: "useEffect" | "useState",
) => {
  const expression = call.expression;

  if (ts.isIdentifier(expression)) {
    const binding = getImportBinding(context, expression);
    if (binding) {
      return (
        binding.moduleName === "react" &&
        binding.kind === "named" &&
        binding.importedName === hookName
      );
    }

    return (
      expression.text === hookName &&
      !hasSourceFileDeclaration(context, expression)
    );
  }

  if (
    !ts.isPropertyAccessExpression(expression) ||
    !ts.isIdentifier(expression.expression) ||
    expression.name.text !== hookName
  ) {
    return false;
  }

  const binding = getImportBinding(context, expression.expression);
  return Boolean(
    binding?.moduleName === "react" &&
    (binding.kind === "default" || binding.kind === "namespace"),
  );
};

interface StateBinding {
  state: ts.Identifier;
  setter: ts.Identifier;
}

const identifierRefersToSymbol = (
  context: DetectorContext,
  identifier: ts.Identifier,
  symbol: ts.Symbol,
) => {
  if (getSymbol(context, identifier) === symbol) {
    return true;
  }

  return Boolean(
    ts.isShorthandPropertyAssignment(identifier.parent) &&
    context.checker.getShorthandAssignmentValueSymbol(identifier.parent) ===
      symbol,
  );
};

const getBindingReferences = (
  context: DetectorContext,
  identifier: ts.Identifier,
  symbol: ts.Symbol,
) =>
  (context.identifiersByText.get(identifier.text) ?? []).filter((candidate) =>
    identifierRefersToSymbol(context, candidate, symbol),
  );

const getContainingVariableDeclaration = (node: ts.Node) => {
  let current: ts.Node | undefined = node;
  while (current) {
    if (ts.isVariableDeclaration(current)) {
      return current;
    }
    if (current !== node && ts.isFunctionLike(current)) {
      return null;
    }
    current = current.parent;
  }
  return null;
};

const expressionReferencesSymbol = (
  context: DetectorContext,
  node: ts.Node,
  symbol: ts.Symbol,
) => {
  let found = false;
  const walk = (current: ts.Node) => {
    if (found) {
      return;
    }
    if (
      ts.isIdentifier(current) &&
      identifierRefersToSymbol(context, current, symbol)
    ) {
      found = true;
      return;
    }
    current.forEachChild(walk);
  };
  walk(node);
  return found;
};

const dependencySourceReadsState = (
  context: DetectorContext,
  dependencyArray: ts.ArrayLiteralExpression,
  stateSymbol: ts.Symbol,
) => {
  for (const dependency of dependencyArray.elements) {
    for (const dependencySymbol of collectIdentifierSymbols(
      context,
      dependency,
    )) {
      for (const declaration of dependencySymbol.declarations ?? []) {
        const variableDeclaration =
          getContainingVariableDeclaration(declaration);
        if (
          variableDeclaration?.initializer &&
          expressionReferencesSymbol(
            context,
            variableDeclaration.initializer,
            stateSymbol,
          )
        ) {
          return true;
        }
      }
    }
  }
  return false;
};

const getStateBinding = (
  context: DetectorContext,
  declaration: ts.VariableDeclaration,
): StateBinding | null => {
  if (
    !ts.isArrayBindingPattern(declaration.name) ||
    declaration.name.elements.length < 2 ||
    !declaration.initializer ||
    !ts.isCallExpression(declaration.initializer) ||
    !isReactHookCall(context, declaration.initializer, "useState")
  ) {
    return null;
  }

  const stateElement = declaration.name.elements[0];
  const setterElement = declaration.name.elements[1];
  if (
    !stateElement ||
    !setterElement ||
    !ts.isBindingElement(stateElement) ||
    !ts.isBindingElement(setterElement) ||
    !ts.isIdentifier(stateElement.name) ||
    !ts.isIdentifier(setterElement.name)
  ) {
    return null;
  }

  return { state: stateElement.name, setter: setterElement.name };
};

const getDirectEffectSetterCall = (
  effect: ts.CallExpression,
  setterSymbol: ts.Symbol,
  context: DetectorContext,
) => {
  const callback = effect.arguments[0];
  if (
    !callback ||
    (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback))
  ) {
    return null;
  }

  let call: ts.CallExpression | null = null;

  if (ts.isBlock(callback.body)) {
    const statement = callback.body.statements[0];
    if (
      callback.body.statements.length !== 1 ||
      !statement ||
      !ts.isExpressionStatement(statement) ||
      !ts.isCallExpression(statement.expression)
    ) {
      return null;
    }
    call = statement.expression;
  } else if (ts.isCallExpression(callback.body)) {
    call = callback.body;
  }

  const argument = call?.arguments[0];
  if (
    !call ||
    !argument ||
    !ts.isIdentifier(call.expression) ||
    getSymbol(context, call.expression) !== setterSymbol ||
    call.arguments.length !== 1 ||
    ts.isArrowFunction(argument) ||
    ts.isFunctionExpression(argument)
  ) {
    return null;
  }

  return call;
};

const collectIdentifierKeys = (context: DetectorContext, node: ts.Node) => {
  const keys = new Set<ts.Symbol | string>();
  const walk = (current: ts.Node) => {
    if (ts.isIdentifier(current)) {
      keys.add(getSymbol(context, current) ?? `text:${current.text}`);
    }
    current.forEachChild(walk);
  };
  walk(node);
  return keys;
};
const collectIdentifierSymbols = (context: DetectorContext, node: ts.Node) => {
  const symbols = new Set<ts.Symbol>();
  const walk = (current: ts.Node) => {
    if (ts.isIdentifier(current)) {
      const symbol = getSymbol(context, current);
      if (symbol) {
        symbols.add(symbol);
      }
    }
    current.forEachChild(walk);
  };
  walk(node);
  return symbols;
};

const derivesFromEffectDependencies = (
  context: DetectorContext,
  expression: ts.Expression,
  dependencyArray: ts.ArrayLiteralExpression,
) => {
  const expressionKeys = collectIdentifierKeys(context, expression);
  if (expressionKeys.size === 0) {
    return false;
  }

  for (const dependency of dependencyArray.elements) {
    for (const key of collectIdentifierKeys(context, dependency)) {
      if (expressionKeys.has(key)) {
        return true;
      }
    }
  }

  return false;
};

export const react004DerivedStateEffectDetector: Detector = {
  dependencyScope: "source-file",
  id: "react-derived-state-effect",
  ruleId: "REACT-004",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];
    const effects = nodesOfKind<ts.CallExpression>(
      context,
      ts.SyntaxKind.CallExpression,
    ).filter((call) => isReactHookCall(context, call, "useEffect"));

    if (effects.length === 0) {
      return findings;
    }

    for (const declaration of nodesOfKind<ts.VariableDeclaration>(
      context,
      ts.SyntaxKind.VariableDeclaration,
    )) {
      const binding = getStateBinding(context, declaration);
      if (!binding) {
        continue;
      }

      const setterSymbol = getSymbol(context, binding.setter);
      if (!setterSymbol) {
        continue;
      }

      const setterReferences = getBindingReferences(
        context,
        binding.setter,
        setterSymbol,
      );
      if (setterReferences.length !== 2) {
        continue;
      }

      const stateSymbol = getSymbol(context, binding.state);
      if (!stateSymbol) {
        continue;
      }

      for (const effect of effects) {
        const setterCall = getDirectEffectSetterCall(
          effect,
          setterSymbol,
          context,
        );
        if (!setterCall) {
          continue;
        }

        const dependencyArray = effect.arguments[1];
        const derivedExpression = setterCall.arguments[0];
        if (
          !dependencyArray ||
          !ts.isArrayLiteralExpression(dependencyArray) ||
          dependencyArray.elements.length === 0 ||
          !derivedExpression ||
          !derivesFromEffectDependencies(
            context,
            derivedExpression,
            dependencyArray,
          ) ||
          dependencySourceReadsState(context, dependencyArray, stateSymbol)
        ) {
          continue;
        }

        findings.push(
          createFinding(context, effect, {
            detectorId: "react-derived-state-effect",
            message:
              `\`${binding.state.text}\` is synchronized from Effect dependencies ` +
              "even though its setter is not used anywhere else.",
            ruleId: "REACT-004",
            suggestion:
              "Derive this value during render instead of storing and " +
              "synchronizing a second copy of the same state.",
          }),
        );
      }
    }

    return findings;
  },
};

export const react004Detectors = [
  react004DerivedStateEffectDetector,
] satisfies readonly Detector[];
