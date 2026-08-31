import ts from "../../../typescript/typescript.cjs";
import { createFinding, nodesOfKind } from "../utils.mjs";
const getTagName = (node) => ts.isIdentifier(node.tagName) ? node.tagName.text : null;
const getAttributes = (node) => node.attributes.properties;
const getAttribute = (node, name) => getAttributes(node).find((attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText() === name);
const hasAttribute = (node, name) => Boolean(getAttribute(node, name));
const hasSpreadAttribute = (node) => getAttributes(node).some(ts.isJsxSpreadAttribute);
const getStringAttribute = (node, name) => {
    const attribute = getAttribute(node, name);
    return attribute?.initializer && ts.isStringLiteral(attribute.initializer)
        ? attribute.initializer.text
        : null;
};
const intrinsicallyInteractiveTags = new Set([
    "button",
    "input",
    "select",
    "summary",
    "textarea",
]);
const nonInteractiveIntrinsicTags = new Set([
    "article",
    "aside",
    "div",
    "footer",
    "header",
    "li",
    "main",
    "p",
    "section",
    "span",
]);
const isNativeInteractive = (node) => {
    const tagName = getTagName(node);
    if (!tagName) {
        return false;
    }
    if (intrinsicallyInteractiveTags.has(tagName)) {
        return true;
    }
    return tagName === "a" && hasAttribute(node, "href");
};
export const semanticInteractiveElementDetector = {
    dependencyScope: "source-file",
    id: "semantic-interactive-element",
    languages: ["jsx", "tsx"],
    ruleId: "A11Y-001",
    analyze: (context) => {
        const findings = [];
        const openings = [
            ...nodesOfKind(context, ts.SyntaxKind.JsxOpeningElement),
            ...nodesOfKind(context, ts.SyntaxKind.JsxSelfClosingElement),
        ];
        for (const node of openings) {
            const tagName = getTagName(node);
            if (!tagName ||
                !nonInteractiveIntrinsicTags.has(tagName) ||
                hasSpreadAttribute(node) ||
                !hasAttribute(node, "onClick")) {
                continue;
            }
            findings.push(createFinding(context, node.tagName, {
                detectorId: "semantic-interactive-element",
                message: `A clickable <${tagName}> recreates native interactive behavior instead of using native semantics.`,
                ruleId: "A11Y-001",
                suggestion: "Use the native interactive element that matches the action, usually `<button>` or `<a>`.",
            }));
        }
        return findings;
    },
};
export const keyboardInteractionDetector = {
    dependencyScope: "source-file",
    id: "keyboard-interaction",
    languages: ["jsx", "tsx"],
    ruleId: "A11Y-002",
    analyze: (context) => {
        const findings = [];
        const openings = [
            ...nodesOfKind(context, ts.SyntaxKind.JsxOpeningElement),
            ...nodesOfKind(context, ts.SyntaxKind.JsxSelfClosingElement),
        ];
        for (const node of openings) {
            const tagName = getTagName(node);
            if (!tagName ||
                isNativeInteractive(node) ||
                hasSpreadAttribute(node) ||
                getStringAttribute(node, "role") !== "button" ||
                !hasAttribute(node, "onClick")) {
                continue;
            }
            const hasKeyboardHandler = hasAttribute(node, "onKeyDown") ||
                hasAttribute(node, "onKeyUp") ||
                hasAttribute(node, "onKeyPress");
            const focusable = hasAttribute(node, "tabIndex");
            if (hasKeyboardHandler && focusable) {
                continue;
            }
            findings.push(createFinding(context, node.tagName, {
                detectorId: "keyboard-interaction",
                message: `This custom ${tagName} button is not fully keyboard-operable${focusable ? "" : " or focusable"}.`,
                ruleId: "A11Y-002",
                suggestion: "Prefer a native `<button>` so focus and keyboard activation are provided by the platform.",
            }));
        }
        return findings;
    },
};
const expressionMayNameControl = (expression) => {
    if (ts.isStringLiteral(expression) ||
        ts.isNoSubstitutionTemplateLiteral(expression) ||
        ts.isNumericLiteral(expression)) {
        return Boolean(expression.text.trim());
    }
    if (ts.isJsxElement(expression) || ts.isJsxSelfClosingElement(expression)) {
        const opening = ts.isJsxElement(expression)
            ? expression.openingElement
            : expression;
        const tagName = getTagName(opening);
        return Boolean(tagName && !tagName.endsWith("Icon"));
    }
    if (ts.isConditionalExpression(expression)) {
        return (expressionMayNameControl(expression.whenTrue) ||
            expressionMayNameControl(expression.whenFalse));
    }
    return true;
};
const childMayNameControl = (child) => {
    if (ts.isJsxText(child)) {
        return Boolean(child.text.trim());
    }
    if (ts.isJsxExpression(child)) {
        return Boolean(child.expression && expressionMayNameControl(child.expression));
    }
    if (ts.isJsxElement(child)) {
        return child.children.some(childMayNameControl);
    }
    if (ts.isJsxSelfClosingElement(child)) {
        const tagName = getTagName(child);
        if (tagName === "img") {
            return Boolean(getStringAttribute(child, "alt")?.trim());
        }
        return Boolean(tagName && /^[A-Z]/.test(tagName) && !tagName.endsWith("Icon"));
    }
    return false;
};
const hasPotentialTextContent = (node) => node.children.some(childMayNameControl);
export const accessibleControlNameDetector = {
    dependencyScope: "source-file",
    id: "accessible-control-name",
    languages: ["jsx", "tsx"],
    ruleId: "A11Y-004",
    analyze: (context) => {
        const findings = [];
        const buttons = nodesOfKind(context, ts.SyntaxKind.JsxElement);
        const selfClosingButtons = nodesOfKind(context, ts.SyntaxKind.JsxSelfClosingElement);
        for (const node of [...buttons, ...selfClosingButtons]) {
            const opening = ts.isJsxElement(node) ? node.openingElement : node;
            if (getTagName(opening) !== "button" ||
                hasSpreadAttribute(opening) ||
                hasAttribute(opening, "aria-label") ||
                hasAttribute(opening, "aria-labelledby") ||
                hasAttribute(opening, "title") ||
                (ts.isJsxElement(node) && hasPotentialTextContent(node))) {
                continue;
            }
            findings.push(createFinding(context, opening.tagName, {
                detectorId: "accessible-control-name",
                message: "This button has no detectable accessible name.",
                ruleId: "A11Y-004",
                suggestion: "Provide visible text or an accessible name such as `aria-label`.",
            }));
        }
        return findings;
    },
};
