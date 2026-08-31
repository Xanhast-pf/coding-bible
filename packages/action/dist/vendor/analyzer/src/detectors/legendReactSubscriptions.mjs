import ts from "../../../typescript/typescript.cjs";
import { createFinding, getImportBinding, getSymbol, hasSourceFileDeclaration, isExecutableFunction, nodesOfKind, } from "../utils.mjs";
const isLegendModule = (moduleName) => moduleName.startsWith("@legendapp/state");
const isImportedFunction = (context, expression, importedName) => {
    if (ts.isIdentifier(expression)) {
        const binding = getImportBinding(context, expression);
        return Boolean(binding &&
            isLegendModule(binding.moduleName) &&
            binding.importedName === importedName);
    }
    if (!ts.isPropertyAccessExpression(expression) ||
        !ts.isIdentifier(expression.expression)) {
        return false;
    }
    const binding = getImportBinding(context, expression.expression);
    return Boolean(binding &&
        binding.kind === "namespace" &&
        isLegendModule(binding.moduleName) &&
        expression.name.text === importedName);
};
const isObserverCall = (context, node) => {
    if (isImportedFunction(context, node.expression, "observer")) {
        return true;
    }
    return (ts.isIdentifier(node.expression) &&
        node.expression.text === "observer" &&
        !hasSourceFileDeclaration(context, node.expression));
};
const collectObservableSymbols = (context) => {
    const symbols = new Set();
    for (const declaration of nodesOfKind(context, ts.SyntaxKind.VariableDeclaration)) {
        if (!ts.isIdentifier(declaration.name) ||
            !declaration.initializer ||
            !ts.isCallExpression(declaration.initializer) ||
            !isImportedFunction(context, declaration.initializer.expression, "observable")) {
            continue;
        }
        const symbol = getSymbol(context, declaration.name);
        if (symbol) {
            symbols.add(symbol);
        }
    }
    return symbols;
};
const getRootIdentifier = (expression) => {
    if (ts.isIdentifier(expression)) {
        return expression;
    }
    if (ts.isPropertyAccessExpression(expression) ||
        ts.isElementAccessExpression(expression)) {
        return getRootIdentifier(expression.expression);
    }
    return null;
};
const isObservableRead = (context, node, observableSymbols) => {
    if (!ts.isPropertyAccessExpression(node.expression) ||
        node.expression.name.text !== "get") {
        return false;
    }
    const root = getRootIdentifier(node.expression.expression);
    if (!root) {
        return false;
    }
    const symbol = getSymbol(context, root);
    return (root.text.endsWith("$") || Boolean(symbol && observableSymbols.has(symbol)));
};
const visitRenderBody = (node, root, visitor) => {
    visitor(node);
    node.forEachChild((child) => {
        if (child !== root && isExecutableFunction(child)) {
            return;
        }
        visitRenderBody(child, root, visitor);
    });
};
export const legendReactSubscriptionDetector = {
    dependencyScope: "source-file",
    id: "legend-react-use-value",
    languages: ["jsx", "tsx"],
    ruleId: "LEGEND-001",
    analyze: (context) => {
        const findings = [];
        const observableSymbols = collectObservableSymbols(context);
        for (const node of nodesOfKind(context, ts.SyntaxKind.CallExpression)) {
            if (!isObserverCall(context, node)) {
                continue;
            }
            const render = node.arguments[0];
            if (!render ||
                (!ts.isArrowFunction(render) && !ts.isFunctionExpression(render))) {
                continue;
            }
            visitRenderBody(render.body, render, (child) => {
                if (!ts.isCallExpression(child) ||
                    !isObservableRead(context, child, observableSymbols)) {
                    return;
                }
                findings.push(createFinding(context, child, {
                    detectorId: "legend-react-use-value",
                    message: "A Legend-State observable is read with `get()` inside an `observer` render.",
                    ruleId: "LEGEND-001",
                    suggestion: "Read the observable with `useValue(...)` in new React code.",
                }));
            });
        }
        return findings;
    },
};
