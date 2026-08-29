import ts from "typescript";

import type {
  AnalyzerFinding,
  DetectorContext,
  ImportBinding,
} from "./types.ts";

export const visit = (node: ts.Node, visitor: (node: ts.Node) => void) => {
  visitor(node);
  node.forEachChild((child) => visit(child, visitor));
};

export const nodesOfKind = <T extends ts.Node>(
  context: DetectorContext,
  kind: ts.SyntaxKind,
): readonly T[] => (context.nodesByKind.get(kind) ?? []) as readonly T[];

export const getSymbol = (
  context: DetectorContext,
  identifier: ts.Identifier,
) => context.checker.getSymbolAtLocation(identifier) ?? null;

export const getReferences = (
  context: DetectorContext,
  identifier: ts.Identifier,
) => {
  const symbol = getSymbol(context, identifier);
  return symbol ? (context.referencesBySymbol.get(symbol) ?? []) : [];
};

export const getImportBinding = (
  context: DetectorContext,
  identifier: ts.Identifier,
): ImportBinding | null => {
  const symbol = getSymbol(context, identifier);
  return symbol ? (context.importsBySymbol.get(symbol) ?? null) : null;
};

export const isImportedBinding = (
  context: DetectorContext,
  identifier: ts.Identifier,
  moduleName: string,
  importedNames?: readonly string[],
) => {
  const binding = getImportBinding(context, identifier);
  return Boolean(
    binding &&
    binding.moduleName === moduleName &&
    (!importedNames || importedNames.includes(binding.importedName)),
  );
};

export const createFinding = (
  context: DetectorContext,
  node: ts.Node,
  details: Pick<
    AnalyzerFinding,
    "detectorId" | "fix" | "message" | "ruleId" | "suggestion"
  >,
): AnalyzerFinding => {
  const start = node.getStart(context.sourceFile);
  const end = node.getEnd();
  const startPosition = context.sourceFile.getLineAndCharacterOfPosition(start);
  const endPosition = context.sourceFile.getLineAndCharacterOfPosition(end);
  const lineStart = context.sourceFile.getPositionOfLineAndCharacter(
    startPosition.line,
    0,
  );
  const lineEnd = context.sourceFile.getLineEndOfPosition(start);

  return {
    ...details,
    excerpt: context.source.slice(lineStart, lineEnd).trimEnd(),
    location: {
      column: startPosition.character + 1,
      endColumn: endPosition.character + 1,
      endLine: endPosition.line + 1,
      line: startPosition.line + 1,
    },
  };
};

export const replaceNodeEdit = (
  context: DetectorContext,
  node: ts.Node,
  replacement: string,
) => ({
  end: node.getEnd(),
  replacement,
  start: node.getStart(context.sourceFile),
});

export const insertBeforeNodeEdit = (
  context: DetectorContext,
  node: ts.Node,
  replacement: string,
) => {
  const start = node.getStart(context.sourceFile);

  return {
    end: start,
    replacement,
    start,
  };
};

export const isPascalCaseName = (value: string) =>
  /^[A-Z][A-Za-z0-9]*$/.test(value);

export type ExecutableFunction =
  | ts.ArrowFunction
  | ts.ConstructorDeclaration
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.GetAccessorDeclaration
  | ts.MethodDeclaration
  | ts.SetAccessorDeclaration;

export const isExecutableFunction = (
  node: ts.Node,
): node is ExecutableFunction =>
  ts.isArrowFunction(node) ||
  ts.isConstructorDeclaration(node) ||
  ts.isFunctionDeclaration(node) ||
  ts.isFunctionExpression(node) ||
  ts.isGetAccessorDeclaration(node) ||
  ts.isMethodDeclaration(node) ||
  ts.isSetAccessorDeclaration(node);

export const getFunctionName = (node: ExecutableFunction): string | null => {
  if (node.name && ts.isIdentifier(node.name)) {
    return node.name.text;
  }

  const parent = node.parent;
  if (
    (ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent)) &&
    ts.isIdentifier(parent.name)
  ) {
    return parent.name.text;
  }

  return null;
};

export const unwrapExpression = (expression: ts.Expression): ts.Expression => {
  let current = expression;

  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAwaitExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }

  return current;
};
