import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../../types.ts";
import { createFinding, nodesOfKind } from "../../utils.ts";
import {
  getStringAttribute,
  getTagName,
  hasAttribute,
  hasSpreadAttribute,
} from "./_jsxAttributes.ts";

const expressionMayNameControl = (expression: ts.Expression): boolean => {
  if (
    ts.isStringLiteral(expression) ||
    ts.isNoSubstitutionTemplateLiteral(expression) ||
    ts.isNumericLiteral(expression)
  ) {
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
    return (
      expressionMayNameControl(expression.whenTrue) ||
      expressionMayNameControl(expression.whenFalse)
    );
  }

  return true;
};

const childMayNameControl = (child: ts.JsxChild): boolean => {
  if (ts.isJsxText(child)) {
    return Boolean(child.text.trim());
  }

  if (ts.isJsxExpression(child)) {
    return Boolean(
      child.expression && expressionMayNameControl(child.expression),
    );
  }

  if (ts.isJsxElement(child)) {
    return child.children.some(childMayNameControl);
  }

  if (ts.isJsxSelfClosingElement(child)) {
    const tagName = getTagName(child);
    if (tagName === "img") {
      return Boolean(getStringAttribute(child, "alt")?.trim());
    }

    return Boolean(
      tagName && /^[A-Z]/.test(tagName) && !tagName.endsWith("Icon"),
    );
  }

  return false;
};

const hasPotentialTextContent = (node: ts.JsxElement) =>
  node.children.some(childMayNameControl);

export const a11y004AccessibleControlNameDetector: Detector = {
  dependencyScope: "source-file",
  id: "accessible-control-name",
  languages: ["js", "jsx", "tsx"],
  ruleId: "A11Y-004",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];
    const buttons = nodesOfKind<ts.JsxElement>(
      context,
      ts.SyntaxKind.JsxElement,
    );
    const selfClosingButtons = nodesOfKind<ts.JsxSelfClosingElement>(
      context,
      ts.SyntaxKind.JsxSelfClosingElement,
    );

    for (const node of [...buttons, ...selfClosingButtons]) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      if (
        getTagName(opening) !== "button" ||
        hasSpreadAttribute(opening) ||
        hasAttribute(opening, "aria-label") ||
        hasAttribute(opening, "aria-labelledby") ||
        hasAttribute(opening, "title") ||
        (ts.isJsxElement(node) && hasPotentialTextContent(node))
      ) {
        continue;
      }

      findings.push(
        createFinding(context, opening.tagName, {
          detectorId: "accessible-control-name",
          message: "This button has no detectable accessible name.",
          ruleId: "A11Y-004",
          suggestion:
            "Provide visible text or an accessible name such as `aria-label`.",
        }),
      );
    }

    return findings;
  },
};

export const a11y004Detectors = [
  a11y004AccessibleControlNameDetector,
] satisfies readonly Detector[];
