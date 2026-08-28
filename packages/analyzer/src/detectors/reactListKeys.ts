import ts from "typescript";

import type { AnalyzerFinding, Detector, DetectorContext } from "../types.ts";
import { createFinding, visit } from "../utils.ts";

const getMapCallback = (node: ts.CallExpression) => {
  if (
    !ts.isPropertyAccessExpression(node.expression) ||
    node.expression.name.text !== "map"
  ) {
    return null;
  }

  const callback = node.arguments[0];
  return callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))
    ? callback
    : null;
};

const getReturnedJsx = (callback: ts.ArrowFunction | ts.FunctionExpression) => {
  if (
    ts.isJsxElement(callback.body) ||
    ts.isJsxSelfClosingElement(callback.body) ||
    ts.isJsxFragment(callback.body)
  ) {
    return callback.body;
  }

  if (!ts.isBlock(callback.body)) {
    return null;
  }

  for (const statement of callback.body.statements) {
    if (
      ts.isReturnStatement(statement) &&
      statement.expression &&
      (ts.isJsxElement(statement.expression) ||
        ts.isJsxSelfClosingElement(statement.expression) ||
        ts.isJsxFragment(statement.expression))
    ) {
      return statement.expression;
    }
  }

  return null;
};

const getKeyAttribute = (jsx: ts.JsxElement | ts.JsxSelfClosingElement) => {
  const attributes = ts.isJsxElement(jsx)
    ? jsx.openingElement.attributes.properties
    : jsx.attributes.properties;

  return attributes.find(
    (attribute): attribute is ts.JsxAttribute =>
      ts.isJsxAttribute(attribute) && attribute.name.getText() === "key",
  );
};

const getAttributeExpression = (attribute: ts.JsxAttribute) =>
  attribute.initializer && ts.isJsxExpression(attribute.initializer)
    ? attribute.initializer.expression
    : undefined;

const isGeneratedKey = (expression: ts.Expression) => {
  if (!ts.isCallExpression(expression) || !ts.isPropertyAccessExpression(expression.expression)) {
    return false;
  }

  const owner = expression.expression.expression;
  const method = expression.expression.name.text;

  return (
    (ts.isIdentifier(owner) && owner.text === "Math" && method === "random") ||
    (ts.isIdentifier(owner) && owner.text === "Date" && method === "now") ||
    (ts.isIdentifier(owner) && owner.text === "crypto" && method === "randomUUID")
  );
};

const findMissingKeys = (context: DetectorContext) => {
  const findings: AnalyzerFinding[] = [];

  visit(context.sourceFile, (node) => {
    if (!ts.isCallExpression(node)) {
      return;
    }

    const callback = getMapCallback(node);
    if (!callback) {
      return;
    }

    const jsx = getReturnedJsx(callback);
    if (!jsx) {
      return;
    }

    if (ts.isJsxFragment(jsx)) {
      findings.push(
        createFinding(context, jsx, {
          detectorId: "react-list-missing-key",
          message: "JSX returned directly from `map()` needs a stable key.",
          ruleId: "REACT-006",
          suggestion:
            "Use a keyed element or `<Fragment key={item.id}>` with identity from the data.",
        }),
      );
      return;
    }

    if (!getKeyAttribute(jsx)) {
      findings.push(
        createFinding(context, jsx, {
          detectorId: "react-list-missing-key",
          message: "JSX returned directly from `map()` is missing a key.",
          ruleId: "REACT-006",
          suggestion: "Add a stable key derived from the item's persistent identity.",
        }),
      );
    }
  });

  return findings;
};

const findUnstableKeys = (context: DetectorContext) => {
  const findings: AnalyzerFinding[] = [];

  visit(context.sourceFile, (node) => {
    if (!ts.isCallExpression(node)) {
      return;
    }

    const callback = getMapCallback(node);
    if (!callback) {
      return;
    }

    const jsx = getReturnedJsx(callback);
    if (!jsx || ts.isJsxFragment(jsx)) {
      return;
    }

    const keyAttribute = getKeyAttribute(jsx);
    if (!keyAttribute) {
      return;
    }

    const keyExpression = getAttributeExpression(keyAttribute);
    if (!keyExpression) {
      return;
    }

    const indexParameter = callback.parameters[1]?.name;
    const usesIndex =
      indexParameter &&
      ts.isIdentifier(indexParameter) &&
      ts.isIdentifier(keyExpression) &&
      keyExpression.text === indexParameter.text;

    if (!usesIndex && !isGeneratedKey(keyExpression)) {
      return;
    }

    findings.push(
      createFinding(context, keyExpression, {
        detectorId: "react-list-unstable-key",
        message: usesIndex
          ? "Array position is being used as a React key."
          : "This React key is generated during render and changes between renders.",
        ruleId: "REACT-006",
        suggestion: "Use a stable identifier that belongs to the underlying item.",
      }),
    );
  });

  return findings;
};

export const missingReactListKeyDetector: Detector = {
  id: "react-list-missing-key",
  ruleId: "REACT-006",
  analyze: findMissingKeys,
};

export const unstableReactListKeyDetector: Detector = {
  id: "react-list-unstable-key",
  ruleId: "REACT-006",
  analyze: findUnstableKeys,
};
