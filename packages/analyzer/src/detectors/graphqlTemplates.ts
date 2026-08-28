import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import { createFinding, visit } from "../utils.ts";

const isGraphqlTag = (tag: ts.LeftHandSideExpression) =>
  ts.isIdentifier(tag) && (tag.text === "gql" || tag.text === "graphql");

const isLikelyDocumentInterpolation = (expression: ts.Expression) => {
  if (!ts.isIdentifier(expression)) {
    return false;
  }

  return /(fragment|document|query|mutation|subscription)$/i.test(expression.text);
};

export const graphqlInterpolationDetector: Detector = {
  id: "graphql-runtime-interpolation",
  ruleId: "GQL-002",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    visit(context.sourceFile, (node) => {
      if (
        !ts.isTaggedTemplateExpression(node) ||
        !isGraphqlTag(node.tag) ||
        !ts.isTemplateExpression(node.template)
      ) {
        return;
      }

      for (const span of node.template.templateSpans) {
        if (isLikelyDocumentInterpolation(span.expression)) {
          continue;
        }

        findings.push(
          createFinding(context, span.expression, {
            detectorId: "graphql-runtime-interpolation",
            message: "A runtime value is interpolated directly into a GraphQL operation document.",
            ruleId: "GQL-002",
            suggestion: "Keep the operation static and pass runtime values through GraphQL variables.",
          }),
        );
      }
    });

    return findings;
  },
};
