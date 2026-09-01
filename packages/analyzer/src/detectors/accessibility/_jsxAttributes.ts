import ts from "typescript";

export type JsxWithAttributes = ts.JsxOpeningElement | ts.JsxSelfClosingElement;

export const getTagName = (node: JsxWithAttributes) =>
  ts.isIdentifier(node.tagName) ? node.tagName.text : null;

const getAttributes = (node: JsxWithAttributes) => node.attributes.properties;

export const getAttribute = (node: JsxWithAttributes, name: string) =>
  getAttributes(node).find(
    (attribute): attribute is ts.JsxAttribute =>
      ts.isJsxAttribute(attribute) && attribute.name.getText() === name,
  );

export const hasAttribute = (node: JsxWithAttributes, name: string) =>
  Boolean(getAttribute(node, name));

export const hasSpreadAttribute = (node: JsxWithAttributes) =>
  getAttributes(node).some(ts.isJsxSpreadAttribute);

export const getStringAttribute = (node: JsxWithAttributes, name: string) => {
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

export const isNativeInteractive = (node: JsxWithAttributes) => {
  const tagName = getTagName(node);
  if (!tagName) {
    return false;
  }

  if (intrinsicallyInteractiveTags.has(tagName)) {
    return true;
  }

  return tagName === "a" && hasAttribute(node, "href");
};
