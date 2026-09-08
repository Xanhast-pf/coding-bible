import ts from "typescript";
export type JsxWithAttributes = ts.JsxOpeningElement | ts.JsxSelfClosingElement;
export declare const getTagName: (node: JsxWithAttributes) => string | null;
export declare const hasAttribute: (node: JsxWithAttributes, name: string) => boolean;
export declare const hasSpreadAttribute: (node: JsxWithAttributes) => boolean;
export declare const getStringAttribute: (node: JsxWithAttributes, name: string) => string | null;
export declare const isNativeInteractive: (node: JsxWithAttributes) => boolean;
