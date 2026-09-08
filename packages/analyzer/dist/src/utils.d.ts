import ts from "typescript";
import type { AnalyzerFinding, DetectorContext, ImportBinding } from "./types.js";
export declare const visit: (node: ts.Node, visitor: (node: ts.Node) => void) => void;
export declare const nodesOfKind: <T extends ts.Node>(context: DetectorContext, kind: ts.SyntaxKind) => readonly T[];
export declare const getSymbol: (context: DetectorContext, identifier: ts.Identifier) => ts.Symbol | null;
export declare const hasSourceFileDeclaration: (context: DetectorContext, identifier: ts.Identifier) => boolean;
export declare const getReferences: (context: DetectorContext, identifier: ts.Identifier) => readonly ts.Identifier[];
export declare const getImportBinding: (context: DetectorContext, identifier: ts.Identifier) => ImportBinding | null;
export declare const isImportedBinding: (context: DetectorContext, identifier: ts.Identifier, moduleName: string, importedNames?: readonly string[]) => boolean;
export declare const createFinding: (context: DetectorContext, node: ts.Node, details: Pick<AnalyzerFinding, "detectorId" | "fix" | "message" | "ruleId" | "ruleRationale" | "ruleTitle" | "ruleUrl" | "suggestion">) => AnalyzerFinding;
export declare const createRangeFinding: (context: DetectorContext, start: number, end: number, details: Pick<AnalyzerFinding, "detectorId" | "fix" | "message" | "ruleId" | "ruleRationale" | "ruleTitle" | "ruleUrl" | "suggestion">) => AnalyzerFinding;
export declare const replaceNodeEdit: (context: DetectorContext, node: ts.Node, replacement: string) => {
    end: number;
    replacement: string;
    start: number;
};
export declare const insertBeforeNodeEdit: (context: DetectorContext, node: ts.Node, replacement: string) => {
    end: number;
    replacement: string;
    start: number;
};
export declare const isPascalCaseName: (value: string) => boolean;
export type ExecutableFunction = ts.ArrowFunction | ts.ConstructorDeclaration | ts.FunctionDeclaration | ts.FunctionExpression | ts.GetAccessorDeclaration | ts.MethodDeclaration | ts.SetAccessorDeclaration;
export declare const isExecutableFunction: (node: ts.Node) => node is ExecutableFunction;
export declare const getFunctionName: (node: ExecutableFunction) => string | null;
export declare const unwrapExpression: (expression: ts.Expression) => ts.Expression;
