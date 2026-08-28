import ts from "typescript";

import type { Detector } from "../types.ts";
import { createFinding, visit } from "../utils.ts";

const isTypeOnlyUsage = (identifier: ts.Identifier) => {
  let current: ts.Node = identifier.parent;

  while (!ts.isStatement(current) && current.kind !== ts.SyntaxKind.SourceFile) {
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
  ruleId: "TS-003",
  analyze: (context) => {
    const findings = [];

    for (const statement of context.sourceFile.statements) {
      if (!ts.isImportDeclaration(statement) || !statement.importClause) {
        continue;
      }

      const { importClause } = statement;
      if (
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

        const localName = specifier.name.text;
        const usages: ts.Identifier[] = [];

        visit(context.sourceFile, (node) => {
          if (
            ts.isIdentifier(node) &&
            node.text === localName &&
            node !== specifier.name &&
            node !== specifier.propertyName
          ) {
            usages.push(node);
          }
        });

        if (!usages.length || !usages.every(isTypeOnlyUsage)) {
          continue;
        }

        findings.push(
          createFinding(context, specifier, {
            detectorId: "type-only-imports",
            message: `\`${localName}\` is used only as a type.`,
            ruleId: "TS-003",
            suggestion:
              `Mark it as type-only: \`import { type ${localName} } ...\` or use \`import type\`.`,
          }),
        );
      }
    }

    return findings;
  },
};
