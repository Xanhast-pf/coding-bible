import ts from "../../../typescript/typescript.cjs";
import { createFinding, getImportBinding, getSymbol, hasSourceFileDeclaration, nodesOfKind, } from "../utils.mjs";
const graphqlModules = new Set([
    "@apollo/client",
    "@urql/core",
    "graphql-request",
    "graphql-tag",
    "urql",
]);
const isGraphqlIdentifier = (context, identifier) => {
    const binding = getImportBinding(context, identifier);
    if (binding) {
        return (graphqlModules.has(binding.moduleName) &&
            (binding.importedName === "gql" ||
                binding.importedName === "graphql" ||
                binding.kind === "default"));
    }
    return ((identifier.text === "gql" || identifier.text === "graphql") &&
        !hasSourceFileDeclaration(context, identifier));
};
const isGraphqlTag = (context, tag) => {
    if (ts.isIdentifier(tag)) {
        return isGraphqlIdentifier(context, tag);
    }
    if (!ts.isPropertyAccessExpression(tag) || !ts.isIdentifier(tag.expression)) {
        return false;
    }
    const binding = getImportBinding(context, tag.expression);
    return Boolean(binding &&
        binding.kind === "namespace" &&
        graphqlModules.has(binding.moduleName) &&
        (tag.name.text === "gql" || tag.name.text === "graphql"));
};
const symbolIsGraphqlDocument = (context, identifier) => {
    const symbol = getSymbol(context, identifier);
    if (!symbol) {
        return false;
    }
    return (symbol.declarations ?? []).some((declaration) => {
        if (!ts.isVariableDeclaration(declaration) || !declaration.initializer) {
            return false;
        }
        return (ts.isTaggedTemplateExpression(declaration.initializer) &&
            isGraphqlTag(context, declaration.initializer.tag));
    });
};
const isLikelyDocumentInterpolation = (context, expression) => {
    if (!ts.isIdentifier(expression)) {
        return false;
    }
    if (symbolIsGraphqlDocument(context, expression)) {
        return true;
    }
    const importBinding = getImportBinding(context, expression);
    if (importBinding &&
        /(fragment|document|query|mutation|subscription)$/i.test(expression.text)) {
        return true;
    }
    return /(fragment|document|query|mutation|subscription)$/i.test(expression.text);
};
export const graphqlInterpolationDetector = {
    dependencyScope: "source-file",
    id: "graphql-runtime-interpolation",
    ruleId: "GQL-002",
    analyze: (context) => {
        const findings = [];
        for (const node of nodesOfKind(context, ts.SyntaxKind.TaggedTemplateExpression)) {
            if (!isGraphqlTag(context, node.tag) ||
                !ts.isTemplateExpression(node.template)) {
                continue;
            }
            for (const span of node.template.templateSpans) {
                if (isLikelyDocumentInterpolation(context, span.expression)) {
                    continue;
                }
                findings.push(createFinding(context, span.expression, {
                    detectorId: "graphql-runtime-interpolation",
                    message: "A runtime value is interpolated directly into a GraphQL operation document.",
                    ruleId: "GQL-002",
                    suggestion: "Keep the operation static and pass runtime values through GraphQL variables.",
                }));
            }
        }
        return findings;
    },
};
