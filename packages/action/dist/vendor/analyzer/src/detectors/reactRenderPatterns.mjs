import ts from "../../../typescript/typescript.cjs";
import { createFinding, getFunctionName, getImportBinding, getReferences, getSymbol, isExecutableFunction, isPascalCaseName, unwrapExpression, visit, } from "../utils.mjs";
const containsJsx = (root) => {
    let found = false;
    const walk = (node) => {
        if (found) {
            return;
        }
        if (node !== root && isExecutableFunction(node)) {
            return;
        }
        if (ts.isJsxElement(node) ||
            ts.isJsxSelfClosingElement(node) ||
            ts.isJsxFragment(node)) {
            found = true;
            return;
        }
        node.forEachChild(walk);
    };
    walk(root);
    return found;
};
const isComponentFunction = (node) => {
    if (!isExecutableFunction(node) || !node.body) {
        return false;
    }
    const name = getFunctionName(node);
    return Boolean(name && isPascalCaseName(name) && containsJsx(node.body));
};
const isStaticExpression = (expression) => {
    const candidate = unwrapExpression(expression);
    if (ts.isStringLiteral(candidate) ||
        ts.isNoSubstitutionTemplateLiteral(candidate) ||
        ts.isNumericLiteral(candidate) ||
        candidate.kind === ts.SyntaxKind.TrueKeyword ||
        candidate.kind === ts.SyntaxKind.FalseKeyword ||
        candidate.kind === ts.SyntaxKind.NullKeyword) {
        return true;
    }
    if (ts.isPrefixUnaryExpression(candidate)) {
        return isStaticExpression(candidate.operand);
    }
    if (ts.isArrayLiteralExpression(candidate)) {
        return candidate.elements.every((element) => !ts.isSpreadElement(element) && isStaticExpression(element));
    }
    if (ts.isObjectLiteralExpression(candidate)) {
        return candidate.properties.every((property) => {
            if (!ts.isPropertyAssignment(property)) {
                return false;
            }
            if (ts.isComputedPropertyName(property.name) &&
                !isStaticExpression(property.name.expression)) {
                return false;
            }
            return isStaticExpression(property.initializer);
        });
    }
    return false;
};
const mutatingMethods = new Set([
    "copyWithin",
    "fill",
    "pop",
    "push",
    "reverse",
    "shift",
    "sort",
    "splice",
    "unshift",
]);
const identifierIsMutated = (context, identifier) => {
    const symbol = getSymbol(context, identifier);
    if (!symbol) {
        return true;
    }
    return getReferences(context, identifier).some((reference) => {
        if (reference === identifier) {
            return false;
        }
        const parent = reference.parent;
        if (ts.isPropertyAccessExpression(parent) &&
            parent.expression === reference &&
            ts.isCallExpression(parent.parent) &&
            parent.parent.expression === parent &&
            mutatingMethods.has(parent.name.text)) {
            return true;
        }
        let current = reference;
        while (current.parent && !ts.isStatement(current.parent)) {
            const owner = current.parent;
            if (ts.isBinaryExpression(owner) &&
                owner.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
                owner.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
                reference.pos >= owner.left.pos &&
                reference.end <= owner.left.end) {
                return true;
            }
            if ((ts.isPrefixUnaryExpression(owner) ||
                ts.isPostfixUnaryExpression(owner)) &&
                (owner.operator === ts.SyntaxKind.PlusPlusToken ||
                    owner.operator === ts.SyntaxKind.MinusMinusToken)) {
                return true;
            }
            current = owner;
        }
        return false;
    });
};
export const staticComponentValueDetector = {
    dependencyScope: "source-file",
    id: "react-static-component-value",
    languages: ["js", "jsx", "tsx"],
    ruleId: "REACT-008",
    analyze: (context) => {
        const findings = [];
        visit(context.sourceFile, (node) => {
            if (!isComponentFunction(node) ||
                !isExecutableFunction(node) ||
                !node.body) {
                return;
            }
            const inspect = (child) => {
                if (child !== node && isExecutableFunction(child)) {
                    return;
                }
                if (ts.isVariableDeclaration(child) &&
                    ts.isIdentifier(child.name) &&
                    child.initializer &&
                    (ts.isArrayLiteralExpression(unwrapExpression(child.initializer)) ||
                        ts.isObjectLiteralExpression(unwrapExpression(child.initializer))) &&
                    isStaticExpression(child.initializer) &&
                    !identifierIsMutated(context, child.name)) {
                    findings.push(createFinding(context, child.name, {
                        detectorId: "react-static-component-value",
                        message: `\`${child.name.text}\` is recreated on every render even though its value is context-free.`,
                        ruleId: "REACT-008",
                        suggestion: "Move this static array/object to module scope.",
                    }));
                }
                child.forEachChild(inspect);
            };
            node.body.forEachChild(inspect);
        });
        return findings;
    },
};
const collectBindingIdentifiers = (name) => {
    if (ts.isIdentifier(name)) {
        return [name];
    }
    return name.elements.flatMap((element) => ts.isBindingElement(element) ? collectBindingIdentifiers(element.name) : []);
};
const getRootIdentifier = (expression) => {
    const candidate = unwrapExpression(expression);
    if (ts.isIdentifier(candidate)) {
        return candidate;
    }
    if (ts.isPropertyAccessExpression(candidate) ||
        ts.isElementAccessExpression(candidate)) {
        return getRootIdentifier(candidate.expression);
    }
    return null;
};
const isReactStateHook = (context, expression) => {
    if (ts.isIdentifier(expression)) {
        const binding = getImportBinding(context, expression);
        return (Boolean(binding?.moduleName === "react" &&
            binding.kind === "named" &&
            (binding.importedName === "useState" ||
                binding.importedName === "useReducer")) ||
            expression.text === "useState" ||
            expression.text === "useReducer");
    }
    if (!ts.isPropertyAccessExpression(expression) ||
        !ts.isIdentifier(expression.expression)) {
        return false;
    }
    const binding = getImportBinding(context, expression.expression);
    return Boolean(binding?.moduleName === "react" &&
        (binding.kind === "default" || binding.kind === "namespace") &&
        (expression.name.text === "useState" ||
            expression.name.text === "useReducer"));
};
const collectProtectedSymbols = (context, component) => {
    const protectedSymbols = new Set();
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
    const declarations = [];
    visit(component.body, (node) => {
        if (ts.isVariableDeclaration(node)) {
            declarations.push(node);
        }
    });
    for (const declaration of declarations) {
        if (!ts.isArrayBindingPattern(declaration.name) ||
            !declaration.initializer ||
            !ts.isCallExpression(declaration.initializer) ||
            !isReactStateHook(context, declaration.initializer.expression)) {
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
const isRefCurrentMutation = (target) => {
    const root = getRootIdentifier(target);
    if (!root || !refLikeIdentifierPattern.test(root.text)) {
        return false;
    }
    let current = target;
    while (ts.isPropertyAccessExpression(current) ||
        ts.isElementAccessExpression(current)) {
        if (ts.isPropertyAccessExpression(current) &&
            current.name.text === "current") {
            return true;
        }
        current = current.expression;
    }
    return false;
};
const assignmentOperatorKinds = new Set([
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
export const reactInputMutationDetector = {
    dependencyScope: "source-file",
    id: "react-input-mutation",
    languages: ["js", "jsx", "tsx"],
    ruleId: "REACT-011",
    analyze: (context) => {
        const findings = [];
        visit(context.sourceFile, (node) => {
            if (!isComponentFunction(node) ||
                !isExecutableFunction(node) ||
                !node.body) {
                return;
            }
            const protectedSymbols = collectProtectedSymbols(context, node);
            if (!protectedSymbols.size) {
                return;
            }
            visit(node.body, (child) => {
                const report = (target) => {
                    if (isRefCurrentMutation(target)) {
                        return;
                    }
                    const root = getRootIdentifier(target);
                    const symbol = root ? getSymbol(context, root) : null;
                    if (!root || !symbol || !protectedSymbols.has(symbol)) {
                        return;
                    }
                    findings.push(createFinding(context, target, {
                        detectorId: "react-input-mutation",
                        message: `\`${root.text}\` aliases React input/state and is mutated directly.`,
                        ruleId: "REACT-011",
                        suggestion: "Derive a new value or use the state setter instead of mutating React-owned snapshots.",
                    }));
                };
                if (ts.isBinaryExpression(child) &&
                    assignmentOperatorKinds.has(child.operatorToken.kind) &&
                    (ts.isPropertyAccessExpression(child.left) ||
                        ts.isElementAccessExpression(child.left))) {
                    report(child.left);
                }
                if ((ts.isPrefixUnaryExpression(child) ||
                    ts.isPostfixUnaryExpression(child)) &&
                    (child.operator === ts.SyntaxKind.PlusPlusToken ||
                        child.operator === ts.SyntaxKind.MinusMinusToken) &&
                    (ts.isPropertyAccessExpression(child.operand) ||
                        ts.isElementAccessExpression(child.operand))) {
                    report(child.operand);
                }
                if (ts.isCallExpression(child) &&
                    ts.isPropertyAccessExpression(child.expression) &&
                    mutatingMethods.has(child.expression.name.text)) {
                    report(child.expression.expression);
                }
            });
        });
        return findings;
    },
};
