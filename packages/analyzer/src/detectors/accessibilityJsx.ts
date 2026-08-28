import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import { createFinding, visit } from "../utils.ts";

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

const genericTags = new Set(["div", "span"]);
const nativeInteractiveTags = new Set(["a", "button", "input", "select", "summary", "textarea"]);

export const semanticInteractiveElementDetector: Detector = {
  id: "semantic-interactive-element",
  ruleId: "A11Y-001",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    visit(context.sourceFile, (node) => {
      if (!ts.isJsxOpeningElement(node) && !ts.isJsxSelfClosingElement(node)) {
        return;
      }

      const tagName = getTagName(node);
      if (
        !tagName ||
        !genericTags.has(tagName) ||
        hasSpreadAttribute(node) ||
        !hasAttribute(node, "onClick") ||
        hasAttribute(node, "role")
      ) {
        return;
      }

      findings.push(
        createFinding(context, node.tagName, {
          detectorId: "semantic-interactive-element",
          message: `A clickable <${tagName}> recreates native interactive behavior without native semantics.`,
          ruleId: "A11Y-001",
          suggestion: "Use the native interactive element that matches the action, usually `<button>` or `<a>`.",
        }),
      );
    });

    return findings;
  },
};

export const keyboardInteractionDetector: Detector = {
  id: "keyboard-interaction",
  ruleId: "A11Y-002",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    visit(context.sourceFile, (node) => {
      if (!ts.isJsxOpeningElement(node) && !ts.isJsxSelfClosingElement(node)) {
        return;
      }

      const tagName = getTagName(node);
      if (
        !tagName ||
        nativeInteractiveTags.has(tagName) ||
        hasSpreadAttribute(node) ||
        getStringAttribute(node, "role") !== "button" ||
        !hasAttribute(node, "onClick") ||
        hasAttribute(node, "onKeyDown") ||
        hasAttribute(node, "onKeyUp") ||
        hasAttribute(node, "onKeyPress")
      ) {
        return;
      }

      findings.push(
        createFinding(context, node.tagName, {
          detectorId: "keyboard-interaction",
          message: `This custom ${tagName} button handles pointer input without an equivalent keyboard handler.`,
          ruleId: "A11Y-002",
          suggestion: "Prefer a native `<button>` so keyboard behavior is provided by the platform.",
        }),
      );
    });

    return findings;
  },
};

const hasPotentialTextContent = (node: ts.JsxElement) => {
  let found = false;

  const walk = (child: ts.Node) => {
    if (found) {
      return;
    }

    if (ts.isJsxText(child) && child.text.trim()) {
      found = true;
      return;
    }

    if (ts.isJsxExpression(child) && child.expression) {
      found = true;
      return;
    }

    if (ts.isJsxSelfClosingElement(child)) {
      const tagName = getTagName(child);
      if (tagName === "img") {
        const alt = getStringAttribute(child, "alt");
        if (alt?.trim()) {
          found = true;
        }
        return;
      }

      if (tagName && /^[A-Z]/.test(tagName) && !tagName.endsWith("Icon")) {
        found = true;
      }
      return;
    }

    child.forEachChild(walk);
  };

  node.children.forEach(walk);
  return found;
};

export const accessibleControlNameDetector: Detector = {
  id: "accessible-control-name",
  ruleId: "A11Y-004",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    visit(context.sourceFile, (node) => {
      const opening = ts.isJsxElement(node)
        ? node.openingElement
        : ts.isJsxSelfClosingElement(node)
          ? node
          : null;

      if (
        !opening ||
        getTagName(opening) !== "button" ||
        hasSpreadAttribute(opening)
      ) {
        return;
      }

      if (
        hasAttribute(opening, "aria-label") ||
        hasAttribute(opening, "aria-labelledby") ||
        hasAttribute(opening, "title")
      ) {
        return;
      }

      if (ts.isJsxElement(node) && hasPotentialTextContent(node)) {
        return;
      }

      findings.push(
        createFinding(context, opening.tagName, {
          detectorId: "accessible-control-name",
          message: "This button has no detectable accessible name.",
          ruleId: "A11Y-004",
          suggestion: "Provide visible text or an accessible name such as `aria-label`.",
        }),
      );
    });

    return findings;
  },
};
