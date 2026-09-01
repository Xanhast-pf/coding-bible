import ts from "../../../../typescript/typescript.cjs";
import { createFinding, nodesOfKind } from "../../utils.mjs";
import { getTagName, hasAttribute, hasSpreadAttribute, } from "./_jsxAttributes.mjs";
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
export const a11y001SemanticInteractiveElementDetector = {
    dependencyScope: "source-file",
    id: "semantic-interactive-element",
    languages: ["js", "jsx", "tsx"],
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
export const a11y001Detectors = [
    a11y001SemanticInteractiveElementDetector,
];
