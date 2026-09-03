import ts from "../../../../typescript/typescript.cjs";
import { createFinding, getImportBinding, hasSourceFileDeclaration, } from "../../utils.mjs";
const reduxToolkitModule = "@reduxjs/toolkit";
const isConfigureStoreCallee = (context, expression) => {
    if (ts.isIdentifier(expression)) {
        const binding = getImportBinding(context, expression);
        if (binding) {
            return (binding.moduleName === reduxToolkitModule &&
                binding.importedName === "configureStore");
        }
        return (expression.text === "configureStore" &&
            !hasSourceFileDeclaration(context, expression));
    }
    if (!ts.isPropertyAccessExpression(expression) ||
        expression.name.text !== "configureStore" ||
        !ts.isIdentifier(expression.expression)) {
        return false;
    }
    const binding = getImportBinding(context, expression.expression);
    return Boolean(binding &&
        binding.moduleName === reduxToolkitModule &&
        binding.kind === "namespace");
};
const exportedConfigureStoreCalls = (context) => {
    const calls = [];
    for (const statement of context.sourceFile.statements) {
        if (!ts.isVariableStatement(statement) ||
            !statement.modifiers?.some(({ kind }) => kind === ts.SyntaxKind.ExportKeyword)) {
            continue;
        }
        for (const declaration of statement.declarationList.declarations) {
            if (declaration.initializer &&
                ts.isCallExpression(declaration.initializer) &&
                isConfigureStoreCallee(context, declaration.initializer.expression)) {
                calls.push(declaration.initializer);
            }
        }
    }
    return calls;
};
export const redux009SingleStoreDetector = {
    dependencyScope: "source-file",
    id: "redux-multiple-exported-stores",
    profile: {
        confidence: "strong",
        contextNote: "A module can intentionally export stores for separate applications, isolated test harnesses, or embeddable roots. Confirm the stores belong to one application before consolidating them.",
        impact: "high",
    },
    ruleId: "REDUX-009",
    analyze: (context) => {
        const stores = exportedConfigureStoreCalls(context);
        if (stores.length <= 1)
            return [];
        return stores.slice(1).map((store) => createFinding(context, store, {
            detectorId: "redux-multiple-exported-stores",
            message: "This module exports more than one Redux store for what appears to be the same application boundary.",
            ruleId: "REDUX-009",
            suggestion: "Combine application reducers into one configureStore() instance unless these stores intentionally belong to separate applications.",
        }));
    },
};
export const redux009Detectors = [
    redux009SingleStoreDetector,
];
