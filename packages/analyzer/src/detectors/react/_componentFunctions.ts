import ts from "typescript";

import {
  getFunctionName,
  isExecutableFunction,
  isPascalCaseName,
} from "../../utils.ts";

export const containsJsx = (root: ts.Node) => {
  let found = false;

  const walk = (node: ts.Node) => {
    if (found) {
      return;
    }

    if (node !== root && isExecutableFunction(node)) {
      return;
    }

    if (
      ts.isJsxElement(node) ||
      ts.isJsxSelfClosingElement(node) ||
      ts.isJsxFragment(node)
    ) {
      found = true;
      return;
    }

    node.forEachChild(walk);
  };

  walk(root);
  return found;
};

export const isComponentFunction = (node: ts.Node) => {
  if (!isExecutableFunction(node) || !node.body) {
    return false;
  }

  const name = getFunctionName(node);
  return Boolean(name && isPascalCaseName(name) && containsJsx(node.body));
};

export const mutatingCollectionMethods = new Set([
  "copyWithin",
  "fill",
  "pop",
  "push",
  "reverse",
  "shift",
  "sort",
  "splice",
  "unshift",
]);
