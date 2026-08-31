import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import { createFinding, visit } from "../utils.ts";

export const noExplicitAnyDetector: Detector = {
  dependencyScope: "source-file",
  id: "no-explicit-any",
  languages: ["ts", "tsx"],
  ruleId: "TS-001",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    visit(context.sourceFile, (node) => {
      if (node.kind !== ts.SyntaxKind.AnyKeyword) {
        return;
      }

      findings.push(
        createFinding(context, node, {
          detectorId: "no-explicit-any",
          message:
            "Explicit `any` disables TypeScript's safety at this boundary.",
          ruleId: "TS-001",
          suggestion:
            "Use the narrowest correct type, or `unknown` until the value is validated.",
        }),
      );
    });

    return findings;
  },
};
