import ts from "../../../../typescript/typescript.cjs";
import { createFinding, nodesOfKind } from "../../utils.mjs";
import { getStringAttribute, getTagName, hasAttribute, hasSpreadAttribute, isNativeInteractive, } from "./_jsxAttributes.mjs";
export const a11y002KeyboardInteractionDetector = {
    dependencyScope: "source-file",
    id: "keyboard-interaction",
    languages: ["js", "jsx", "tsx"],
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
export const a11y002Detectors = [
    a11y002KeyboardInteractionDetector,
];
