import ts from "../../../../typescript/typescript.cjs";
import { createFinding, getSymbol, nodesOfKind, replaceNodeEdit, unwrapExpression, } from "../../utils.mjs";
const nonMutatingReplacementByMethod = new Map([
    ["sort", "toSorted"],
    ["reverse", "toReversed"],
]);
const getReadableReceiver = (expression) => {
    const candidate = unwrapExpression(expression);
    if (ts.isIdentifier(candidate) ||
        ts.isPropertyAccessExpression(candidate) ||
        ts.isElementAccessExpression(candidate)) {
        return candidate.getText();
    }
    return null;
};
const isFreshCollectionInitializer = (expression) => {
    const candidate = unwrapExpression(expression);
    if (ts.isArrayLiteralExpression(candidate)) {
        return true;
    }
    if (!ts.isCallExpression(candidate)) {
        return false;
    }
    if (ts.isPropertyAccessExpression(candidate.expression) &&
        ts.isIdentifier(candidate.expression.expression) &&
        candidate.expression.expression.text === "Array" &&
        candidate.expression.name.text === "from") {
        return true;
    }
    return (ts.isPropertyAccessExpression(candidate.expression) &&
        ["concat", "slice", "toReversed", "toSorted", "toSpliced"].includes(candidate.expression.name.text));
};
const isFreshLocalCollection = (context, expression) => {
    const candidate = unwrapExpression(expression);
    if (!ts.isIdentifier(candidate)) {
        return false;
    }
    const symbol = getSymbol(context, candidate);
    return Boolean(symbol?.declarations?.some((declaration) => ts.isVariableDeclaration(declaration) &&
        declaration.initializer &&
        isFreshCollectionInitializer(declaration.initializer)));
};
export const js006NonMutatingCollectionDetector = {
    dependencyScope: "source-file",
    id: "non-mutating-collection-copy",
    ruleId: "JS-006",
    analyze: (context) => {
        const findings = [];
        for (const node of nodesOfKind(context, ts.SyntaxKind.VariableDeclaration)) {
            if (!ts.isIdentifier(node.name) ||
                !node.initializer ||
                !ts.isCallExpression(node.initializer) ||
                !ts.isPropertyAccessExpression(node.initializer.expression)) {
                continue;
            }
            const receiverExpression = node.initializer.expression.expression;
            const method = node.initializer.expression.name.text;
            const replacement = nonMutatingReplacementByMethod.get(method);
            const receiver = getReadableReceiver(receiverExpression);
            if (!replacement ||
                !receiver ||
                receiver === node.name.text ||
                isFreshLocalCollection(context, receiverExpression)) {
                continue;
            }
            findings.push(createFinding(context, node.initializer, {
                detectorId: "non-mutating-collection-copy",
                fix: {
                    description: `Replace \`${method}\` with \`${replacement}\`. Review runtime support and identity/performance expectations before applying.`,
                    edits: [
                        replaceNodeEdit(context, node.initializer.expression.name, replacement),
                    ],
                    safety: "review",
                    title: `Use ${replacement}()`,
                },
                message: `\`${receiver}.${method}()\` mutates \`${receiver}\` while its result is stored as a separate value.`,
                ruleId: "JS-006",
                suggestion: `Use \`${receiver}.${replacement}(...)\` when the original collection should remain unchanged.`,
            }));
        }
        return findings;
    },
};
export const js006Detectors = [
    js006NonMutatingCollectionDetector,
];
