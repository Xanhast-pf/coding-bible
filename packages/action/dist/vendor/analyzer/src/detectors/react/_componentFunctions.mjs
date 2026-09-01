import ts from "../../../../typescript/typescript.cjs";
import { getFunctionName, isExecutableFunction, isPascalCaseName, } from "../../utils.mjs";
export const containsJsx = (root) => {
    let found = false;
    const walk = (node) => {
        if (found) {
            return;
        }
        if (node !== root && isExecutableFunction(node)) {
            return;
        }
        if (ts.isJsxElement(node) ||
            ts.isJsxSelfClosingElement(node) ||
            ts.isJsxFragment(node)) {
            found = true;
            return;
        }
        node.forEachChild(walk);
    };
    walk(root);
    return found;
};
export const isComponentFunction = (node) => {
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
