import ts from "../../../typescript/typescript.cjs";
import { createFinding, getReferences, getSymbol, nodesOfKind, } from "../utils.mjs";
const assignmentOperators = new Set([
    ts.SyntaxKind.EqualsToken,
    ts.SyntaxKind.PlusEqualsToken,
    ts.SyntaxKind.MinusEqualsToken,
    ts.SyntaxKind.AsteriskEqualsToken,
    ts.SyntaxKind.AsteriskAsteriskEqualsToken,
    ts.SyntaxKind.SlashEqualsToken,
    ts.SyntaxKind.PercentEqualsToken,
    ts.SyntaxKind.LessThanLessThanEqualsToken,
    ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
    ts.SyntaxKind.AmpersandEqualsToken,
    ts.SyntaxKind.BarEqualsToken,
    ts.SyntaxKind.CaretEqualsToken,
    ts.SyntaxKind.BarBarEqualsToken,
    ts.SyntaxKind.AmpersandAmpersandEqualsToken,
    ts.SyntaxKind.QuestionQuestionEqualsToken,
]);
const collectBindingIdentifiers = (name) => {
    if (ts.isIdentifier(name)) {
        return [name];
    }
    return name.elements.flatMap((element) => ts.isBindingElement(element) ? collectBindingIdentifiers(element.name) : []);
};
const containsNode = (ancestor, candidate) => candidate.pos >= ancestor.pos && candidate.end <= ancestor.end;
const isWriteReference = (identifier) => {
    let current = identifier;
    while (current.parent) {
        const parent = current.parent;
        if (ts.isBinaryExpression(parent) &&
            assignmentOperators.has(parent.operatorToken.kind) &&
            containsNode(parent.left, identifier)) {
            return true;
        }
        if ((ts.isPrefixUnaryExpression(parent) ||
            ts.isPostfixUnaryExpression(parent)) &&
            (parent.operator === ts.SyntaxKind.PlusPlusToken ||
                parent.operator === ts.SyntaxKind.MinusMinusToken) &&
            containsNode(parent.operand, identifier)) {
            return true;
        }
        if ((ts.isForInStatement(parent) || ts.isForOfStatement(parent)) &&
            !ts.isVariableDeclarationList(parent.initializer) &&
            containsNode(parent.initializer, identifier)) {
            return true;
        }
        if (ts.isStatement(parent) ||
            ts.isVariableDeclaration(parent) ||
            ts.isParameter(parent)) {
            return false;
        }
        current = parent;
    }
    return false;
};
const isReassigned = (context, identifier) => {
    const symbol = getSymbol(context, identifier);
    if (!symbol) {
        return true;
    }
    return getReferences(context, identifier).some((reference) => reference !== identifier && isWriteReference(reference));
};
const isLoopInitializer = (node) => {
    const parent = node.parent;
    return ((ts.isForStatement(parent) && parent.initializer === node) ||
        ((ts.isForInStatement(parent) || ts.isForOfStatement(parent)) &&
            parent.initializer === node));
};
export const preferConstDetector = {
    dependencyScope: "source-file",
    id: "prefer-const",
    ruleId: "CORE-003",
    analyze: (context) => {
        const findings = [];
        for (const node of nodesOfKind(context, ts.SyntaxKind.VariableDeclarationList)) {
            if (!(node.flags & ts.NodeFlags.Let) || isLoopInitializer(node)) {
                continue;
            }
            const initializedBindings = node.declarations.flatMap((declaration) => declaration.initializer
                ? collectBindingIdentifiers(declaration.name)
                : []);
            if (!initializedBindings.length ||
                initializedBindings.some((identifier) => isReassigned(context, identifier))) {
                continue;
            }
            for (const identifier of initializedBindings) {
                findings.push(createFinding(context, identifier, {
                    detectorId: "prefer-const",
                    message: `\`${identifier.text}\` is declared with \`let\` but is never reassigned.`,
                    ruleId: "CORE-003",
                    suggestion: "Use `const` so the binding contract is explicit.",
                }));
            }
        }
        return findings;
    },
};
