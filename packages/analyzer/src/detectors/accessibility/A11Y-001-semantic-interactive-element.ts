import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../../types.ts";
import { createFinding, nodesOfKind } from "../../utils.ts";
import {
  getTagName,
  hasAttribute,
  hasSpreadAttribute,
} from "./_jsxAttributes.ts";

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

export const a11y001SemanticInteractiveElementDetector: Detector = {
  dependencyScope: "source-file",
  id: "semantic-interactive-element",
  languages: ["js", "jsx", "tsx"],
  ruleId: "A11Y-001",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];
    const openings = [
      ...nodesOfKind<ts.JsxOpeningElement>(
        context,
        ts.SyntaxKind.JsxOpeningElement,
      ),
      ...nodesOfKind<ts.JsxSelfClosingElement>(
        context,
        ts.SyntaxKind.JsxSelfClosingElement,
      ),
    ];

    for (const node of openings) {
      const tagName = getTagName(node);
      if (
        !tagName ||
        !nonInteractiveIntrinsicTags.has(tagName) ||
        hasSpreadAttribute(node) ||
        !hasAttribute(node, "onClick")
      ) {
        continue;
      }

      findings.push(
        createFinding(context, node.tagName, {
          detectorId: "semantic-interactive-element",
          message: `A clickable <${tagName}> recreates native interactive behavior instead of using native semantics.`,
          ruleId: "A11Y-001",
          suggestion:
            "Use the native interactive element that matches the action, usually `<button>` or `<a>`.",
        }),
      );
    }

    return findings;
  },
};

export const a11y001Detectors = [
  a11y001SemanticInteractiveElementDetector,
] satisfies readonly Detector[];
