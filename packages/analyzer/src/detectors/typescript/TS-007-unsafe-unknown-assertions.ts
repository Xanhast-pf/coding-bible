import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../../types.ts";
import { createFinding, nodesOfKind } from "../../utils.ts";

const isAssertion = (
  node: ts.Node,
): node is ts.AsExpression | ts.TypeAssertion =>
  ts.isAsExpression(node) || ts.isTypeAssertionExpression(node);

const isUnknownType = (type: ts.Type) =>
  (type.flags & ts.TypeFlags.Unknown) !== 0;

const isUnknownTypeNode = (node: ts.TypeNode) =>
  node.kind === ts.SyntaxKind.UnknownKeyword;

const getTargetText = (
  node: ts.AsExpression | ts.TypeAssertion,
  sourceFile: ts.SourceFile,
) => node.type.getText(sourceFile);

export const ts007UnsafeUnknownAssertionDetector: Detector = {
  dependencyScope: "source-file",
  id: "unknown-type-assertion",
  languages: ["ts", "tsx"],
  ruleId: "TS-007",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];
    const assertions = [
      ...nodesOfKind<ts.AsExpression>(context, ts.SyntaxKind.AsExpression),
      ...nodesOfKind<ts.TypeAssertion>(
        context,
        ts.SyntaxKind.TypeAssertionExpression,
      ),
    ];

    for (const node of assertions) {
      if (isUnknownTypeNode(node.type)) {
        continue;
      }

      const sourceType = context.checker.getTypeAtLocation(node.expression);
      const explicitlyBridgedThroughUnknown =
        isAssertion(node.expression) && isUnknownTypeNode(node.expression.type);

      if (!isUnknownType(sourceType) && !explicitlyBridgedThroughUnknown) {
        continue;
      }

      const target = getTargetText(node, context.sourceFile);
      findings.push(
        createFinding(context, node, {
          detectorId: "unknown-type-assertion",
          message: `An \`unknown\` value is asserted directly to \`${target}\` without narrowing or validation.`,
          ruleId: "TS-007",
          suggestion:
            "Narrow or validate the value first so the compiler can prove the target type instead of forcing the assertion.",
        }),
      );
    }

    return findings;
  },
};

export const ts007Detectors = [
  ts007UnsafeUnknownAssertionDetector,
] satisfies readonly Detector[];
