import ts from "../../../typescript/typescript.cjs";
import { createFinding, nodesOfKind } from "../utils.mjs";
const localizationModules = new Set([
    "@formatjs/intl",
    "@lingui/macro",
    "@lingui/react",
    "i18next",
    "next-intl",
    "react-i18next",
    "react-intl",
]);
const sourceFileUsesLocalization = (context) => context.sourceFile.statements.some((statement) => ts.isImportDeclaration(statement) &&
    ts.isStringLiteral(statement.moduleSpecifier) &&
    localizationModules.has(statement.moduleSpecifier.text));
const isTestOrStoryFile = (fileName) => /(?:^|\/)(?:__tests__)(?:\/|$)|\.(?:test|spec|stories?|fixture)\.[cm]?[jt]sx?$/i.test(fileName.replaceAll("\\", "/"));
const htmlEntityPattern = /&(?:#\d+|#x[\da-f]+|[a-z][\w-]*);/giu;
const ignoredContainerTags = new Set(["code", "pre", "script", "style"]);
const normalizeVisibleText = (text) => text.replace(htmlEntityPattern, "").replace(/\s+/gu, " ").trim();
const hasHumanText = (text) => /\p{L}/u.test(normalizeVisibleText(text));
const getParentTagName = (node) => {
    if (!ts.isJsxElement(node.parent)) {
        return null;
    }
    const { tagName } = node.parent.openingElement;
    return ts.isIdentifier(tagName) ? tagName.text : null;
};
export const hardcodedJsxTextDetector = {
    dependencyScope: "source-file",
    id: "hardcoded-jsx-text",
    languages: ["js", "jsx", "tsx"],
    ruleId: "I18N-001",
    analyze: (context) => {
        if (isTestOrStoryFile(context.sourceFile.fileName) ||
            !sourceFileUsesLocalization(context)) {
            return [];
        }
        const findings = [];
        for (const node of nodesOfKind(context, ts.SyntaxKind.JsxText)) {
            const parentTagName = getParentTagName(node);
            if (!hasHumanText(node.text) ||
                (parentTagName && ignoredContainerTags.has(parentTagName))) {
                continue;
            }
            const visibleText = node.text.replace(/\s+/gu, " ").trim();
            findings.push(createFinding(context, node, {
                detectorId: "hardcoded-jsx-text",
                message: `User-visible JSX text is hardcoded${visibleText ? `: \`${visibleText}\`` : ""}.`,
                ruleId: "I18N-001",
                suggestion: "Move this copy into the localization system already used by this file instead of rendering a hardcoded string.",
            }));
        }
        return findings;
    },
};
