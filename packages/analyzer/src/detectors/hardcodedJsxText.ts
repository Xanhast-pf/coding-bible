import ts from "typescript";

import type { AnalyzerFinding, Detector, DetectorContext } from "../types.ts";
import { createFinding, nodesOfKind } from "../utils.ts";

const localizationModules = new Set([
  "@formatjs/intl",
  "@lingui/macro",
  "@lingui/react",
  "i18next",
  "next-intl",
  "react-i18next",
  "react-intl",
]);

const sourceFileUsesLocalization = (context: DetectorContext) =>
  context.sourceFile.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      localizationModules.has(statement.moduleSpecifier.text),
  );

const isTestOrStoryFile = (fileName: string) =>
  /(?:^|\/)(?:__tests__)(?:\/|$)|\.(?:test|spec|stories?|fixture)\.[cm]?[jt]sx?$/i.test(
    fileName.replaceAll("\\", "/"),
  );

const htmlEntityPattern = /&(?:#\d+|#x[\da-f]+|[a-z][\w-]*);/giu;
const ignoredContainerTags = new Set(["code", "pre", "script", "style"]);

const normalizeVisibleText = (text: string) =>
  text.replace(htmlEntityPattern, "").replace(/\s+/gu, " ").trim();

const hasHumanText = (text: string) =>
  /\p{L}/u.test(normalizeVisibleText(text));

const getParentTagName = (node: ts.JsxText) => {
  if (!ts.isJsxElement(node.parent)) {
    return null;
  }

  const { tagName } = node.parent.openingElement;
  return ts.isIdentifier(tagName) ? tagName.text : null;
};

export const hardcodedJsxTextDetector: Detector = {
  dependencyScope: "source-file",
  id: "hardcoded-jsx-text",
  languages: ["js", "jsx", "tsx"],
  ruleId: "I18N-001",
  analyze: (context) => {
    if (
      isTestOrStoryFile(context.sourceFile.fileName) ||
      !sourceFileUsesLocalization(context)
    ) {
      return [];
    }

    const findings: AnalyzerFinding[] = [];

    for (const node of nodesOfKind<ts.JsxText>(
      context,
      ts.SyntaxKind.JsxText,
    )) {
      const parentTagName = getParentTagName(node);
      if (
        !hasHumanText(node.text) ||
        (parentTagName && ignoredContainerTags.has(parentTagName))
      ) {
        continue;
      }

      const visibleText = node.text.replace(/\s+/gu, " ").trim();
      findings.push(
        createFinding(context, node, {
          detectorId: "hardcoded-jsx-text",
          message: `User-visible JSX text is hardcoded${visibleText ? `: \`${visibleText}\`` : ""}.`,
          ruleId: "I18N-001",
          suggestion:
            "Move this copy into the localization system already used by this file instead of rendering a hardcoded string.",
        }),
      );
    }

    return findings;
  },
};
