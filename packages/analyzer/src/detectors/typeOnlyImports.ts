import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import {
  createFinding,
  getReferences,
  insertBeforeNodeEdit,
  nodesOfKind,
} from "../utils.ts";

const isTypeOnlyUsage = (identifier: ts.Identifier) => {
  let current: ts.Node = identifier.parent;

  while (
    !ts.isStatement(current) &&
    current.kind !== ts.SyntaxKind.SourceFile
  ) {
    if (ts.isTypeQueryNode(current)) {
      return false;
    }

    if (ts.isTypeNode(current)) {
      return true;
    }

    if (ts.isExpression(current)) {
      return false;
    }

    current = current.parent;
  }

  return false;
};

export const typeOnlyImportsDetector: Detector = {
  id: "type-only-imports",
  languages: ["ts", "tsx"],
  ruleId: "TS-003",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    for (const statement of nodesOfKind<ts.ImportDeclaration>(
      context,
      ts.SyntaxKind.ImportDeclaration,
    )) {
      const { importClause } = statement;
      if (
        !importClause ||
        importClause.isTypeOnly ||
        !importClause.namedBindings ||
        !ts.isNamedImports(importClause.namedBindings)
      ) {
        continue;
      }

      for (const specifier of importClause.namedBindings.elements) {
        if (specifier.isTypeOnly) {
          continue;
        }

        const usages = getReferences(context, specifier.name).filter(
          (identifier) =>
            identifier !== specifier.name &&
            identifier !== specifier.propertyName,
        );

        if (!usages.length || !usages.every(isTypeOnlyUsage)) {
          continue;
        }

        findings.push(
          createFinding(context, specifier, {
            detectorId: "type-only-imports",
            fix: {
              description: `Mark \`${specifier.name.text}\` as type-only without changing the other imports in this declaration.`,
              edits: [insertBeforeNodeEdit(context, specifier, "type ")],
              safety: "safe",
              title: "Mark import as type-only",
            },
            message: `\`${specifier.name.text}\` is used only as a type.`,
            ruleId: "TS-003",
            suggestion: `Mark it as type-only: \`import { type ${specifier.name.text} } ...\` or use \`import type\`.`,
          }),
        );
      }
    }

    return findings;
  },
};
