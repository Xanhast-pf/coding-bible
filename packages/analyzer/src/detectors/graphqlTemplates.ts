import ts from "typescript";

import type { AnalyzerFinding, Detector, DetectorContext } from "../types.ts";
import {
  createFinding,
  getImportBinding,
  getSymbol,
  nodesOfKind,
} from "../utils.ts";

const graphqlModules = new Set([
  "@apollo/client",
  "@urql/core",
  "graphql-request",
  "graphql-tag",
  "urql",
]);

const isGraphqlIdentifier = (
  context: DetectorContext,
  identifier: ts.Identifier,
) => {
  const binding = getImportBinding(context, identifier);
  if (binding) {
    return (
      graphqlModules.has(binding.moduleName) &&
      (binding.importedName === "gql" ||
        binding.importedName === "graphql" ||
        binding.kind === "default")
    );
  }

  return (
    (identifier.text === "gql" || identifier.text === "graphql") &&
    !getSymbol(context, identifier)
  );
};

const isGraphqlTag = (
  context: DetectorContext,
  tag: ts.LeftHandSideExpression,
) => {
  if (ts.isIdentifier(tag)) {
    return isGraphqlIdentifier(context, tag);
  }

  if (!ts.isPropertyAccessExpression(tag) || !ts.isIdentifier(tag.expression)) {
    return false;
  }

  const binding = getImportBinding(context, tag.expression);
  return Boolean(
    binding &&
    binding.kind === "namespace" &&
    graphqlModules.has(binding.moduleName) &&
    (tag.name.text === "gql" || tag.name.text === "graphql"),
  );
};

const symbolIsGraphqlDocument = (
  context: DetectorContext,
  identifier: ts.Identifier,
) => {
  const symbol = getSymbol(context, identifier);
  if (!symbol) {
    return false;
  }

  return (symbol.declarations ?? []).some((declaration) => {
    if (!ts.isVariableDeclaration(declaration) || !declaration.initializer) {
      return false;
    }

    return (
      ts.isTaggedTemplateExpression(declaration.initializer) &&
      isGraphqlTag(context, declaration.initializer.tag)
    );
  });
};

const isLikelyDocumentInterpolation = (
  context: DetectorContext,
  expression: ts.Expression,
) => {
  if (!ts.isIdentifier(expression)) {
    return false;
  }

  if (symbolIsGraphqlDocument(context, expression)) {
    return true;
  }

  const importBinding = getImportBinding(context, expression);
  if (
    importBinding &&
    /(fragment|document|query|mutation|subscription)$/i.test(expression.text)
  ) {
    return true;
  }

  return /(fragment|document|query|mutation|subscription)$/i.test(
    expression.text,
  );
};

export const graphqlInterpolationDetector: Detector = {
  id: "graphql-runtime-interpolation",
  ruleId: "GQL-002",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    for (const node of nodesOfKind<ts.TaggedTemplateExpression>(
      context,
      ts.SyntaxKind.TaggedTemplateExpression,
    )) {
      if (
        !isGraphqlTag(context, node.tag) ||
        !ts.isTemplateExpression(node.template)
      ) {
        continue;
      }

      for (const span of node.template.templateSpans) {
        if (isLikelyDocumentInterpolation(context, span.expression)) {
          continue;
        }

        findings.push(
          createFinding(context, span.expression, {
            detectorId: "graphql-runtime-interpolation",
            message:
              "A runtime value is interpolated directly into a GraphQL operation document.",
            ruleId: "GQL-002",
            suggestion:
              "Keep the operation static and pass runtime values through GraphQL variables.",
          }),
        );
      }
    }

    return findings;
  },
};
