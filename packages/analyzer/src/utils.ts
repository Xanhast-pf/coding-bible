import ts from "typescript";

import type { AnalyzerFinding, DetectorContext } from "./types.ts";

export const visit = (node: ts.Node, visitor: (node: ts.Node) => void) => {
  visitor(node);
  node.forEachChild((child) => visit(child, visitor));
};

export const createFinding = (
  context: DetectorContext,
  node: ts.Node,
  details: Pick<
    AnalyzerFinding,
    "detectorId" | "message" | "ruleId" | "suggestion"
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

export const isPascalCaseName = (value: string) => /^[A-Z][A-Za-z0-9]*$/.test(value);

export type ExecutableFunction =
  | ts.ArrowFunction
  | ts.ConstructorDeclaration
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.GetAccessorDeclaration
  | ts.MethodDeclaration
  | ts.SetAccessorDeclaration;

export const isExecutableFunction = (node: ts.Node): node is ExecutableFunction =>
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
    ts.isNonNullExpression(current)
  ) {
    current = current.expression;
  }

  return current;
};
