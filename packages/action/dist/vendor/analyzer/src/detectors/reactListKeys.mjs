import ts from "../../../typescript/typescript.cjs";
import { createFinding, getSymbol, nodesOfKind, visit } from "../utils.mjs";
const getMapCallback = (node) => {
    if (!ts.isPropertyAccessExpression(node.expression) ||
        node.expression.name.text !== "map") {
        return null;
    }
    const callback = node.arguments[0];
    return callback &&
        (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))
        ? callback
        : null;
};
const collectJsxRoots = (expression) => {
    if (ts.isJsxElement(expression) ||
        ts.isJsxSelfClosingElement(expression) ||
        ts.isJsxFragment(expression)) {
        return [expression];
    }
    if (ts.isParenthesizedExpression(expression)) {
        return collectJsxRoots(expression.expression);
    }
    if (ts.isConditionalExpression(expression)) {
        return [
            ...collectJsxRoots(expression.whenTrue),
            ...collectJsxRoots(expression.whenFalse),
        ];
    }
    if (ts.isBinaryExpression(expression) &&
        expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
        return collectJsxRoots(expression.right);
    }
    return [];
};
const getReturnedJsx = (callback) => {
    if (!ts.isBlock(callback.body)) {
        return collectJsxRoots(callback.body);
    }
    const jsxRoots = [];
    const walk = (node) => {
        if (node !== callback.body &&
            (ts.isFunctionLike(node) || ts.isClassLike(node))) {
            return;
        }
        if (ts.isReturnStatement(node) && node.expression) {
            jsxRoots.push(...collectJsxRoots(node.expression));
            return;
        }
        node.forEachChild(walk);
    };
    callback.body.forEachChild(walk);
    return jsxRoots;
};
const getKeyAttribute = (jsx) => {
    const attributes = ts.isJsxElement(jsx)
        ? jsx.openingElement.attributes.properties
        : jsx.attributes.properties;
    return attributes.find((attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText() === "key");
};
const getAttributeExpression = (attribute) => attribute.initializer && ts.isJsxExpression(attribute.initializer)
    ? attribute.initializer.expression
    : undefined;
const expressionContainsSymbol = (context, expression, symbol) => {
    let found = false;
    visit(expression, (node) => {
        if (found || !ts.isIdentifier(node)) {
            return;
        }
        if (getSymbol(context, node) === symbol) {
            found = true;
        }
    });
    return found;
};
const containsGeneratedKey = (expression) => {
    let generated = false;
    visit(expression, (node) => {
        if (generated ||
            !ts.isCallExpression(node) ||
            !ts.isPropertyAccessExpression(node.expression)) {
            return;
        }
        const owner = node.expression.expression;
        const method = node.expression.name.text;
        generated =
            (ts.isIdentifier(owner) &&
                owner.text === "Math" &&
                method === "random") ||
                (ts.isIdentifier(owner) && owner.text === "Date" && method === "now") ||
                (ts.isIdentifier(owner) &&
                    owner.text === "crypto" &&
                    method === "randomUUID");
    });
    return generated;
};
const findMissingKeys = (context) => {
    const findings = [];
    for (const node of nodesOfKind(context, ts.SyntaxKind.CallExpression)) {
        const callback = getMapCallback(node);
        if (!callback) {
            continue;
        }
        for (const jsx of getReturnedJsx(callback)) {
            if (ts.isJsxFragment(jsx)) {
                findings.push(createFinding(context, jsx, {
                    detectorId: "react-list-missing-key",
                    message: "JSX returned directly from `map()` needs a stable key.",
                    ruleId: "REACT-006",
                    suggestion: "Use a keyed element or `<Fragment key={item.id}>` with identity from the data.",
                }));
                continue;
            }
            if (!getKeyAttribute(jsx)) {
                findings.push(createFinding(context, jsx, {
                    detectorId: "react-list-missing-key",
                    message: "JSX returned directly from `map()` is missing a key.",
                    ruleId: "REACT-006",
                    suggestion: "Add a stable key derived from the item's persistent identity.",
                }));
            }
        }
    }
    return findings;
};
const findUnstableKeys = (context) => {
    const findings = [];
    for (const node of nodesOfKind(context, ts.SyntaxKind.CallExpression)) {
        const callback = getMapCallback(node);
        if (!callback) {
            continue;
        }
        const indexParameter = callback.parameters[1]?.name;
        const indexSymbol = indexParameter && ts.isIdentifier(indexParameter)
            ? getSymbol(context, indexParameter)
            : null;
        for (const jsx of getReturnedJsx(callback)) {
            if (ts.isJsxFragment(jsx)) {
                continue;
            }
            const keyAttribute = getKeyAttribute(jsx);
            if (!keyAttribute) {
                continue;
            }
            const keyExpression = getAttributeExpression(keyAttribute);
            if (!keyExpression) {
                continue;
            }
            const usesIndex = Boolean(indexSymbol &&
                expressionContainsSymbol(context, keyExpression, indexSymbol));
            const generated = containsGeneratedKey(keyExpression);
            if (!usesIndex && !generated) {
                continue;
            }
            findings.push(createFinding(context, keyExpression, {
                detectorId: "react-list-unstable-key",
                message: usesIndex
                    ? "Array position contributes to this React key."
                    : "This React key is generated during render and changes between renders.",
                ruleId: "REACT-006",
                suggestion: "Use a stable identifier that belongs to the underlying item.",
            }));
        }
    }
    return findings;
};
export const missingReactListKeyDetector = {
    id: "react-list-missing-key",
    languages: ["jsx", "tsx"],
    ruleId: "REACT-006",
    analyze: findMissingKeys,
};
export const unstableReactListKeyDetector = {
    id: "react-list-unstable-key",
    languages: ["jsx", "tsx"],
    ruleId: "REACT-006",
    analyze: findUnstableKeys,
};
