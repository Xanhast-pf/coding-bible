import ts from "../../../typescript/typescript.cjs";
import { createFinding, unwrapExpression, visit } from "../utils.mjs";
const isAsyncFunction = (node) => Boolean((ts.isArrowFunction(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isMethodDeclaration(node)) &&
    node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword));
const visitFunctionBody = (root, visitor) => {
    const walk = (node) => {
        if (node !== root && ts.isFunctionLike(node)) {
            return;
        }
        visitor(node);
        node.forEachChild(walk);
    };
    if (root.body) {
        walk(root.body);
    }
};
const hasAwaitSemantics = (node) => {
    if ((ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isMethodDeclaration(node)) &&
        node.asteriskToken) {
        return true;
    }
    let found = false;
    visitFunctionBody(node, (candidate) => {
        if (ts.isAwaitExpression(candidate) ||
            (ts.isForOfStatement(candidate) && candidate.awaitModifier)) {
            found = true;
        }
    });
    return found;
};
const hasThrow = (node) => {
    let found = false;
    visitFunctionBody(node, (candidate) => {
        if (ts.isThrowStatement(candidate)) {
            found = true;
        }
    });
    return found;
};
const getReturnedExpressions = (node) => {
    if (node.body && !ts.isBlock(node.body)) {
        return [node.body];
    }
    const returned = [];
    visitFunctionBody(node, (candidate) => {
        if (ts.isReturnStatement(candidate)) {
            returned.push(candidate.expression ?? null);
        }
    });
    return returned;
};
const isPromiseTypeName = (name) => {
    if (ts.isIdentifier(name)) {
        return name.text === "Promise" || name.text === "PromiseLike";
    }
    return isPromiseTypeName(name.right);
};
const isPromiseTypeNode = (context, type, seen = new Set()) => {
    if (ts.isParenthesizedTypeNode(type)) {
        return isPromiseTypeNode(context, type.type, seen);
    }
    if (ts.isUnionTypeNode(type) || ts.isIntersectionTypeNode(type)) {
        return type.types.some((member) => isPromiseTypeNode(context, member, seen));
    }
    if (!ts.isTypeReferenceNode(type)) {
        return false;
    }
    if (isPromiseTypeName(type.typeName)) {
        return true;
    }
    const symbol = context.checker.getSymbolAtLocation(type.typeName);
    if (!symbol || seen.has(symbol)) {
        return false;
    }
    seen.add(symbol);
    return Boolean(symbol.declarations?.some((declaration) => ts.isTypeAliasDeclaration(declaration) &&
        isPromiseTypeNode(context, declaration.type, seen)));
};
const typeNodeHasPromiseReturningCall = (context, type, seen = new Set()) => {
    if (ts.isParenthesizedTypeNode(type)) {
        return typeNodeHasPromiseReturningCall(context, type.type, seen);
    }
    if (ts.isUnionTypeNode(type) || ts.isIntersectionTypeNode(type)) {
        return type.types.some((member) => typeNodeHasPromiseReturningCall(context, member, seen));
    }
    if (ts.isFunctionTypeNode(type)) {
        return isPromiseTypeNode(context, type.type);
    }
    if (ts.isTypeLiteralNode(type)) {
        return type.members.some((member) => ts.isCallSignatureDeclaration(member) &&
            Boolean(member.type) &&
            isPromiseTypeNode(context, member.type));
    }
    if (!ts.isTypeReferenceNode(type)) {
        return false;
    }
    const symbol = context.checker.getSymbolAtLocation(type.typeName);
    if (!symbol || seen.has(symbol)) {
        return false;
    }
    seen.add(symbol);
    return Boolean(symbol.declarations?.some((declaration) => {
        if (ts.isTypeAliasDeclaration(declaration)) {
            return typeNodeHasPromiseReturningCall(context, declaration.type, seen);
        }
        if (ts.isInterfaceDeclaration(declaration)) {
            return declaration.members.some((member) => ts.isCallSignatureDeclaration(member) &&
                Boolean(member.type) &&
                isPromiseTypeNode(context, member.type));
        }
        return false;
    }));
};
const hasExplicitPromiseReturnType = (context, node) => Boolean(node.type && isPromiseTypeNode(context, node.type));
const hasSyntacticPromiseContext = (context, node) => {
    if (!ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) {
        return false;
    }
    const parent = node.parent;
    return Boolean(ts.isVariableDeclaration(parent) &&
        parent.initializer === node &&
        parent.type &&
        typeNodeHasPromiseReturningCall(context, parent.type));
};
const isKnownPromiseFactory = (expression) => {
    const candidate = unwrapExpression(expression);
    if (ts.isNewExpression(candidate) &&
        ts.isIdentifier(candidate.expression) &&
        candidate.expression.text === "Promise") {
        return true;
    }
    if (!ts.isCallExpression(candidate)) {
        return false;
    }
    const callee = unwrapExpression(candidate.expression);
    if ((ts.isArrowFunction(callee) || ts.isFunctionExpression(callee)) &&
        callee.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)) {
        return true;
    }
    return (ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.expression) &&
        callee.expression.text === "Promise" &&
        ["all", "allSettled", "any", "race", "reject", "resolve", "try"].includes(callee.name.text));
};
const isDefinitelySynchronousSyntax = (expression) => {
    const candidate = unwrapExpression(expression);
    if (ts.isStringLiteralLike(candidate) ||
        ts.isNumericLiteral(candidate) ||
        candidate.kind === ts.SyntaxKind.TrueKeyword ||
        candidate.kind === ts.SyntaxKind.FalseKeyword ||
        candidate.kind === ts.SyntaxKind.NullKeyword ||
        ts.isObjectLiteralExpression(candidate) ||
        ts.isArrayLiteralExpression(candidate) ||
        ts.isTemplateExpression(candidate) ||
        ts.isNoSubstitutionTemplateLiteral(candidate) ||
        ts.isJsxElement(candidate) ||
        ts.isJsxSelfClosingElement(candidate) ||
        ts.isFunctionExpression(candidate) ||
        ts.isArrowFunction(candidate) ||
        ts.isClassExpression(candidate)) {
        return true;
    }
    if (ts.isPrefixUnaryExpression(candidate)) {
        return isDefinitelySynchronousSyntax(candidate.operand);
    }
    if (ts.isBinaryExpression(candidate)) {
        return (isDefinitelySynchronousSyntax(candidate.left) &&
            isDefinitelySynchronousSyntax(candidate.right));
    }
    if (ts.isConditionalExpression(candidate)) {
        return (isDefinitelySynchronousSyntax(candidate.whenTrue) &&
            isDefinitelySynchronousSyntax(candidate.whenFalse));
    }
    return false;
};
const isPromiseLikeType = (context, expression) => {
    const type = context.checker.getTypeAtLocation(expression);
    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
        return null;
    }
    return Boolean(context.checker.getPropertyOfType(type, "then"));
};
const contextualReturnIsPromiseLike = (context, node) => {
    if (!ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) {
        return false;
    }
    const contextualType = context.checker.getContextualType(node);
    if (!contextualType) {
        return false;
    }
    return contextualType.getCallSignatures().some((signature) => {
        const returnType = signature.getReturnType();
        if (returnType.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
            return false;
        }
        return Boolean(context.checker.getPropertyOfType(returnType, "then"));
    });
};
const hasIntentionalPromiseReturn = (context, node, returned) => {
    if (hasExplicitPromiseReturnType(context, node) ||
        hasSyntacticPromiseContext(context, node) ||
        contextualReturnIsPromiseLike(context, node)) {
        return true;
    }
    return returned.some((expression) => {
        if (!expression) {
            return false;
        }
        if (isKnownPromiseFactory(expression)) {
            return true;
        }
        return isPromiseLikeType(context, expression) === true;
    });
};
const getWrappedExpression = (node) => {
    let current = node;
    while (ts.isParenthesizedExpression(current.parent) ||
        ts.isAsExpression(current.parent) ||
        ts.isSatisfiesExpression(current.parent)) {
        current = current.parent;
    }
    return current;
};
const isPassedAsCallbackArgument = (node) => {
    if (!ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) {
        return false;
    }
    const current = getWrappedExpression(node);
    return ((ts.isCallExpression(current.parent) ||
        ts.isNewExpression(current.parent)) &&
        Boolean(current.parent.arguments?.includes(current)));
};
const isDefaultCallbackContract = (node) => {
    if (!ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) {
        return false;
    }
    const current = getWrappedExpression(node);
    return (ts.isParameter(current.parent) && current.parent.initializer === current);
};
const isClearlyRedundantAsync = (context, node) => {
    if (!node.body ||
        hasAwaitSemantics(node) ||
        hasThrow(node) ||
        isPassedAsCallbackArgument(node) ||
        isDefaultCallbackContract(node)) {
        return false;
    }
    const returned = getReturnedExpressions(node);
    if (hasIntentionalPromiseReturn(context, node, returned)) {
        return false;
    }
    if (!returned.length || returned.every((expression) => expression === null)) {
        return true;
    }
    return returned.every((expression) => expression && isDefinitelySynchronousSyntax(expression));
};
export const redundantAsyncDetector = {
    dependencyScope: "source-file",
    id: "redundant-async-function",
    ruleId: "JS-001",
    analyze: (context) => {
        const findings = [];
        visit(context.sourceFile, (node) => {
            if (!isAsyncFunction(node) || !isClearlyRedundantAsync(context, node)) {
                return;
            }
            findings.push(createFinding(context, node, {
                detectorId: "redundant-async-function",
                message: "This function is marked async but has no asynchronous work or Promise-producing return path.",
                ruleId: "JS-001",
                suggestion: "Remove `async`, or keep it only when the function intentionally exposes a Promise-returning contract.",
            }));
        });
        return findings;
    },
};
