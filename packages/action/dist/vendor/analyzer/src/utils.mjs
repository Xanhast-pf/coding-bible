import ts from "../../typescript/typescript.cjs";
export const visit = (node, visitor) => {
    visitor(node);
    node.forEachChild((child) => visit(child, visitor));
};
export const nodesOfKind = (context, kind) => (context.nodesByKind.get(kind) ?? []);
export const getSymbol = (context, identifier) => context.checker.getSymbolAtLocation(identifier) ?? null;
export const getReferences = (context, identifier) => {
    const symbol = getSymbol(context, identifier);
    return symbol ? (context.referencesBySymbol.get(symbol) ?? []) : [];
};
export const getImportBinding = (context, identifier) => {
    const symbol = getSymbol(context, identifier);
    return symbol ? (context.importsBySymbol.get(symbol) ?? null) : null;
};
export const isImportedBinding = (context, identifier, moduleName, importedNames) => {
    const binding = getImportBinding(context, identifier);
    return Boolean(binding &&
        binding.moduleName === moduleName &&
        (!importedNames || importedNames.includes(binding.importedName)));
};
export const createFinding = (context, node, details) => {
    const start = node.getStart(context.sourceFile);
    const end = node.getEnd();
    const startPosition = context.sourceFile.getLineAndCharacterOfPosition(start);
    const endPosition = context.sourceFile.getLineAndCharacterOfPosition(end);
    const lineStart = context.sourceFile.getPositionOfLineAndCharacter(startPosition.line, 0);
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
export const replaceNodeEdit = (context, node, replacement) => ({
    end: node.getEnd(),
    replacement,
    start: node.getStart(context.sourceFile),
});
export const insertBeforeNodeEdit = (context, node, replacement) => {
    const start = node.getStart(context.sourceFile);
    return {
        end: start,
        replacement,
        start,
    };
};
export const isPascalCaseName = (value) => /^[A-Z][A-Za-z0-9]*$/.test(value);
export const isExecutableFunction = (node) => ts.isArrowFunction(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isSetAccessorDeclaration(node);
export const getFunctionName = (node) => {
    if (node.name && ts.isIdentifier(node.name)) {
        return node.name.text;
    }
    const parent = node.parent;
    if ((ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent)) &&
        ts.isIdentifier(parent.name)) {
        return parent.name.text;
    }
    return null;
};
export const unwrapExpression = (expression) => {
    let current = expression;
    while (ts.isParenthesizedExpression(current) ||
        ts.isAwaitExpression(current) ||
        ts.isNonNullExpression(current) ||
        ts.isSatisfiesExpression(current)) {
        current = current.expression;
    }
    return current;
};
