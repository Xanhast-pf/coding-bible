import ts from "../../../../typescript/typescript.cjs";
export const getTagName = (node) => ts.isIdentifier(node.tagName) ? node.tagName.text : null;
const getAttributes = (node) => node.attributes.properties;
export const getAttribute = (node, name) => getAttributes(node).find((attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText() === name);
export const hasAttribute = (node, name) => Boolean(getAttribute(node, name));
export const hasSpreadAttribute = (node) => getAttributes(node).some(ts.isJsxSpreadAttribute);
export const getStringAttribute = (node, name) => {
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
export const isNativeInteractive = (node) => {
    const tagName = getTagName(node);
    if (!tagName) {
        return false;
    }
    if (intrinsicallyInteractiveTags.has(tagName)) {
        return true;
    }
    return tagName === "a" && hasAttribute(node, "href");
};
