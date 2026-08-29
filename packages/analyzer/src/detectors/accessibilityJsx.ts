import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import { createFinding, nodesOfKind } from "../utils.ts";

type JsxWithAttributes = ts.JsxOpeningElement | ts.JsxSelfClosingElement;

const getTagName = (node: JsxWithAttributes) =>
  ts.isIdentifier(node.tagName) ? node.tagName.text : null;

const getAttributes = (node: JsxWithAttributes) => node.attributes.properties;

const getAttribute = (node: JsxWithAttributes, name: string) =>
  getAttributes(node).find(
    (attribute): attribute is ts.JsxAttribute =>
      ts.isJsxAttribute(attribute) && attribute.name.getText() === name,
  );

const hasAttribute = (node: JsxWithAttributes, name: string) => Boolean(getAttribute(node, name));

const hasSpreadAttribute = (node: JsxWithAttributes) =>
  getAttributes(node).some(ts.isJsxSpreadAttribute);

const getStringAttribute = (node: JsxWithAttributes, name: string) => {
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

const isNativeInteractive = (node: JsxWithAttributes) => {
  const tagName = getTagName(node);
  if (!tagName) {
    return false;
  }

  if (intrinsicallyInteractiveTags.has(tagName)) {
    return true;
  }

  return tagName === "a" && hasAttribute(node, "href");
};

export const semanticInteractiveElementDetector: Detector = {
  id: "semantic-interactive-element",
  languages: ["jsx", "tsx"],
  ruleId: "A11Y-001",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];
    const openings = [
      ...nodesOfKind<ts.JsxOpeningElement>(context, ts.SyntaxKind.JsxOpeningElement),
      ...nodesOfKind<ts.JsxSelfClosingElement>(context, ts.SyntaxKind.JsxSelfClosingElement),
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
          suggestion: "Use the native interactive element that matches the action, usually `<button>` or `<a>`.",
        }),
      );
    }

    return findings;
  },
};

export const keyboardInteractionDetector: Detector = {
  id: "keyboard-interaction",
  languages: ["jsx", "tsx"],
  ruleId: "A11Y-002",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];
    const openings = [
      ...nodesOfKind<ts.JsxOpeningElement>(context, ts.SyntaxKind.JsxOpeningElement),
      ...nodesOfKind<ts.JsxSelfClosingElement>(context, ts.SyntaxKind.JsxSelfClosingElement),
    ];

    for (const node of openings) {
      const tagName = getTagName(node);
      if (
        !tagName ||
        isNativeInteractive(node) ||
        hasSpreadAttribute(node) ||
        getStringAttribute(node, "role") !== "button" ||
        !hasAttribute(node, "onClick")
      ) {
        continue;
      }

      const hasKeyboardHandler =
        hasAttribute(node, "onKeyDown") ||
        hasAttribute(node, "onKeyUp") ||
        hasAttribute(node, "onKeyPress");
      const focusable = hasAttribute(node, "tabIndex");

      if (hasKeyboardHandler && focusable) {
        continue;
      }

      findings.push(
        createFinding(context, node.tagName, {
          detectorId: "keyboard-interaction",
          message: `This custom ${tagName} button is not fully keyboard-operable${focusable ? "" : " or focusable"}.`,
          ruleId: "A11Y-002",
          suggestion: "Prefer a native `<button>` so focus and keyboard activation are provided by the platform.",
        }),
      );
    }

    return findings;
  },
};

const expressionMayNameControl = (expression: ts.Expression): boolean => {
  if (
    ts.isStringLiteral(expression) ||
    ts.isNoSubstitutionTemplateLiteral(expression) ||
    ts.isNumericLiteral(expression)
  ) {
    return Boolean(expression.text.trim());
  }

  if (ts.isJsxElement(expression) || ts.isJsxSelfClosingElement(expression)) {
    const opening = ts.isJsxElement(expression) ? expression.openingElement : expression;
    const tagName = getTagName(opening);
    return Boolean(tagName && !tagName.endsWith("Icon"));
  }

  if (ts.isConditionalExpression(expression)) {
    return expressionMayNameControl(expression.whenTrue) || expressionMayNameControl(expression.whenFalse);
  }

  return true;
};

const childMayNameControl = (child: ts.JsxChild): boolean => {
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

const hasPotentialTextContent = (node: ts.JsxElement) =>
  node.children.some(childMayNameControl);

export const accessibleControlNameDetector: Detector = {
  id: "accessible-control-name",
  languages: ["jsx", "tsx"],
  ruleId: "A11Y-004",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];
    const buttons = nodesOfKind<ts.JsxElement>(context, ts.SyntaxKind.JsxElement);
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
          suggestion: "Provide visible text or an accessible name such as `aria-label`.",
        }),
      );
    }

    return findings;
  },
};
