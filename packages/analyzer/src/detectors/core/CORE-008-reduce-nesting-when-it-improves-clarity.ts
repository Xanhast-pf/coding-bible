import ts from "typescript";

import type { Detector } from "../../types.ts";
import { createFinding, nodesOfKind } from "../../utils.ts";

const detector: Detector = {
  dependencyScope: "source-file",
  id: "core_008-single-nested-if",
  ruleId: "CORE-008",
  languages: ["ts", "tsx", "js", "jsx"],
  profile: {
    confidence: "contextual",
    impact: "low",
    contextNote:
      "Reports only a simple if whose block contains one nested if and no else; review whether a guard clause is actually clearer.",
  },
  analyze: (context) =>
    nodesOfKind<ts.IfStatement>(context, ts.SyntaxKind.IfStatement)
      .filter((node) => {
        if (node.elseStatement) return false;
        if (!ts.isBlock(node.thenStatement)) return false;
        if (node.thenStatement.statements.length !== 1) return false;
        const nested = node.thenStatement.statements[0];
        return Boolean(
          nested && ts.isIfStatement(nested) && !nested.elseStatement,
        );
      })
      .map((node) =>
        createFinding(context, node, {
          detectorId: "core_008-single-nested-if",
          ruleId: "CORE-008",
          message:
            "A simple if contains only another if, which may be clearer as a guard clause or combined condition.",
          suggestion:
            "Consider flattening this branch when an early exit or combined condition preserves clarity.",
        }),
      ),
};

export const core008Detectors = [detector];
