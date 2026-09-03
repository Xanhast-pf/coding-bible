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

const tanstackReactQueryModule = "@tanstack/react-query";

const isUseQueryCallee = (
  context: DetectorContext,
  expression: ts.Expression,
) => {
  if (ts.isIdentifier(expression)) {
    const binding = getImportBinding(context, expression);
    if (binding) {
      return (
        binding.moduleName === tanstackReactQueryModule &&
        binding.importedName === "useQuery"
      );
    }

    return (
      expression.text === "useQuery" &&
      !hasSourceFileDeclaration(context, expression)
    );
  }

  if (
    !ts.isPropertyAccessExpression(expression) ||
    expression.name.text !== "useQuery" ||
    !ts.isIdentifier(expression.expression)
  ) {
    return false;
  }

  const binding = getImportBinding(context, expression.expression);
  return Boolean(
    binding &&
    binding.moduleName === tanstackReactQueryModule &&
    binding.kind === "namespace",
  );
};

const propertyAssignment = (object: ts.ObjectLiteralExpression, name: string) =>
  object.properties.find(
    (property): property is ts.PropertyAssignment =>
      ts.isPropertyAssignment(property) &&
      ((ts.isIdentifier(property.name) && property.name.text === name) ||
        (ts.isStringLiteral(property.name) && property.name.text === name)),
  );

const isWithin = (node: ts.Node, ancestor: ts.Node) =>
  node.pos >= ancestor.pos && node.end <= ancestor.end;

const isReferenceIdentifier = (identifier: ts.Identifier) => {
  const parent = identifier.parent;

  if (
    (ts.isPropertyAccessExpression(parent) && parent.name === identifier) ||
    (ts.isPropertyAssignment(parent) && parent.name === identifier) ||
    (ts.isShorthandPropertyAssignment(parent) && parent.name === identifier) ||
    (ts.isVariableDeclaration(parent) && parent.name === identifier) ||
    (ts.isParameter(parent) && parent.name === identifier) ||
    (ts.isFunctionDeclaration(parent) && parent.name === identifier) ||
    (ts.isFunctionExpression(parent) && parent.name === identifier) ||
    (ts.isClassDeclaration(parent) && parent.name === identifier) ||
    (ts.isImportSpecifier(parent) &&
      (parent.name === identifier || parent.propertyName === identifier)) ||
    (ts.isImportClause(parent) && parent.name === identifier)
  ) {
    return false;
  }

  return true;
};

const queryFunctionDependencies = (
  context: DetectorContext,
  queryFunction: ts.ArrowFunction | ts.FunctionExpression,
) => {
  const dependencies = new Set<string>();

  const visit = (node: ts.Node) => {
    if (node !== queryFunction && ts.isFunctionLike(node)) {
      return;
    }

    if (ts.isIdentifier(node) && isReferenceIdentifier(node)) {
      const parent = node.parent;
      if (ts.isCallExpression(parent) && parent.expression === node) {
        return;
      }

      const binding = getImportBinding(context, node);
      if (binding) return;

      const symbol = getSymbol(context, node);
      const declarations = symbol?.declarations ?? [];
      if (
        declarations.some((declaration) => isWithin(declaration, queryFunction))
      ) {
        return;
      }
      if (
        declarations.some(
          (declaration) =>
            ts.isFunctionDeclaration(declaration) ||
            ts.isClassDeclaration(declaration) ||
            ts.isInterfaceDeclaration(declaration) ||
            ts.isTypeAliasDeclaration(declaration) ||
            ts.isEnumDeclaration(declaration),
        )
      ) {
        return;
      }

      dependencies.add(node.text);
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(queryFunction.body, visit);
  return dependencies;
};

const queryKeyIdentifiers = (node: ts.Expression) => {
  const identifiers = new Set<string>();

  const visit = (current: ts.Node) => {
    if (
      ts.isIdentifier(current) &&
      !(
        ts.isPropertyAccessExpression(current.parent) &&
        current.parent.name === current
      )
    ) {
      identifiers.add(current.text);
    }
    ts.forEachChild(current, visit);
  };

  visit(node);
  return identifiers;
};

export const tq001QueryKeyDependenciesDetector: Detector = {
  dependencyScope: "source-file",
  id: "tanstack-query-missing-key-dependency",
  profile: {
    confidence: "strong",
    contextNote:
      "The analyzer tracks direct lexical dependencies captured by an inline queryFn. Stable globals, intentionally invariant values, or dependencies hidden behind helper abstractions may require repository context.",
    impact: "high",
  },
  ruleId: "TQ-001",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    for (const call of nodesOfKind<ts.CallExpression>(
      context,
      ts.SyntaxKind.CallExpression,
    )) {
      if (!isUseQueryCallee(context, call.expression)) continue;

      const options = call.arguments[0];
      if (!options || !ts.isObjectLiteralExpression(options)) continue;

      const queryKey = propertyAssignment(options, "queryKey")?.initializer;
      const queryFn = propertyAssignment(options, "queryFn")?.initializer;
      if (
        !queryKey ||
        !queryFn ||
        !(ts.isArrowFunction(queryFn) || ts.isFunctionExpression(queryFn))
      ) {
        continue;
      }

      const dependencies = queryFunctionDependencies(context, queryFn);
      const keyIdentifiers = queryKeyIdentifiers(queryKey);
      const missing = [...dependencies]
        .filter((name) => !keyIdentifiers.has(name))
        .sort();

      if (!missing.length) continue;

      findings.push(
        createFinding(context, queryKey, {
          detectorId: "tanstack-query-missing-key-dependency",
          message: `queryFn captures ${missing.join(", ")} but the query key does not include ${missing.length === 1 ? "that dependency" : "those dependencies"}.`,
          ruleId: "TQ-001",
          suggestion:
            "Include every changing value used by queryFn in queryKey so cache identity follows the data dependency.",
        }),
      );
    }

    return findings;
  },
};

export const tq001Detectors = [
  tq001QueryKeyDependenciesDetector,
] satisfies readonly Detector[];
