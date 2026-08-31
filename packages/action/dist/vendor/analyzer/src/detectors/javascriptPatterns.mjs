import ts from "../../../typescript/typescript.cjs";
import { createFinding, getSymbol, isExecutableFunction, nodesOfKind, replaceNodeEdit, unwrapExpression, visit, } from "../utils.mjs";
const flattenLogicalAnd = (expression) => {
    if (ts.isBinaryExpression(expression) &&
        expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
        return [
            ...flattenLogicalAnd(expression.left),
            ...flattenLogicalAnd(expression.right),
        ];
    }
    return [expression];
};
const getStaticElementName = (expression) => {
    const argument = expression.argumentExpression;
    return argument &&
        (ts.isStringLiteral(argument) || ts.isNumericLiteral(argument))
        ? argument.text
        : null;
};
const getPropertyPath = (expression) => {
    const candidate = unwrapExpression(expression);
    if (ts.isIdentifier(candidate)) {
        return [candidate.text];
    }
    if (ts.isPropertyAccessExpression(candidate)) {
        const parentPath = getPropertyPath(candidate.expression);
        return parentPath ? [...parentPath, candidate.name.text] : null;
    }
    if (ts.isElementAccessExpression(candidate)) {
        const parentPath = getPropertyPath(candidate.expression);
        const elementName = getStaticElementName(candidate);
        return parentPath && elementName !== null
            ? [...parentPath, elementName]
            : null;
    }
    return null;
};
const isExtendingPath = (previous, next) => next.length > previous.length &&
    previous.every((part, index) => next[index] === part);
export const optionalChainingDetector = {
    dependencyScope: "source-file",
    id: "optional-chaining-guard-chain",
    ruleId: "JS-002",
    analyze: (context) => {
        const findings = [];
        for (const node of nodesOfKind(context, ts.SyntaxKind.BinaryExpression)) {
            if (node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken ||
                (ts.isBinaryExpression(node.parent) &&
                    node.parent.operatorToken.kind ===
                        ts.SyntaxKind.AmpersandAmpersandToken)) {
                continue;
            }
            const operands = flattenLogicalAnd(node);
            if (operands.length < 2) {
                continue;
            }
            const paths = operands.map(getPropertyPath);
            if (paths.some((path) => !path) ||
                !paths.slice(1).every((path, index) => {
                    const previous = paths[index];
                    return Boolean(previous && path && isExtendingPath(previous, path));
                })) {
                continue;
            }
            findings.push(createFinding(context, node, {
                detectorId: "optional-chaining-guard-chain",
                message: "This repeated nullish access guard can be expressed more clearly with optional chaining.",
                ruleId: "JS-002",
                suggestion: "Use optional chaining when null/undefined are the values you intend to guard against.",
            }));
        }
        return findings;
    },
};
const typeContainsNull = (type) => {
    if (!type) {
        return false;
    }
    if (type.kind === ts.SyntaxKind.NullKeyword ||
        (ts.isLiteralTypeNode(type) &&
            type.literal.kind === ts.SyntaxKind.NullKeyword)) {
        return true;
    }
    return ts.isUnionTypeNode(type) && type.types.some(typeContainsNull);
};
const typeContainsUndefined = (type) => {
    if (!type) {
        return false;
    }
    if (type.kind === ts.SyntaxKind.UndefinedKeyword) {
        return true;
    }
    return ts.isUnionTypeNode(type) && type.types.some(typeContainsUndefined);
};
const isUndefinedOnlyDefaultCandidate = (parameter) => !typeContainsNull(parameter.type) &&
    (Boolean(parameter.questionToken) || typeContainsUndefined(parameter.type));
export const defaultParameterDetector = {
    dependencyScope: "source-file",
    id: "default-parameter-normalization",
    languages: ["ts", "tsx"],
    ruleId: "JS-003",
    analyze: (context) => {
        const findings = [];
        visit(context.sourceFile, (node) => {
            if (!isExecutableFunction(node) || !node.body || !ts.isBlock(node.body)) {
                return;
            }
            const parameters = new Map(node.parameters
                .filter((parameter) => ts.isIdentifier(parameter.name) &&
                !parameter.initializer &&
                isUndefinedOnlyDefaultCandidate(parameter))
                .map((parameter) => [
                parameter.name.text,
                parameter,
            ]));
            if (!parameters.size) {
                return;
            }
            for (const statement of node.body.statements) {
                if (!ts.isExpressionStatement(statement) ||
                    !ts.isBinaryExpression(statement.expression)) {
                    continue;
                }
                const assignment = statement.expression;
                if (assignment.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
                    !ts.isIdentifier(assignment.left) ||
                    !parameters.has(assignment.left.text) ||
                    !ts.isBinaryExpression(assignment.right) ||
                    assignment.right.operatorToken.kind !==
                        ts.SyntaxKind.QuestionQuestionToken ||
                    !ts.isIdentifier(assignment.right.left) ||
                    assignment.right.left.text !== assignment.left.text) {
                    continue;
                }
                findings.push(createFinding(context, assignment, {
                    detectorId: "default-parameter-normalization",
                    message: `\`${assignment.left.text}\` is normalized from undefined inside the function body.`,
                    ruleId: "JS-003",
                    suggestion: "Express this default directly in the parameter list.",
                }));
            }
        });
        return findings;
    },
};
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
export const nonMutatingCollectionDetector = {
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
