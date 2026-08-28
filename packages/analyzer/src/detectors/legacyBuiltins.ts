import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import { createFinding, visit } from "../utils.ts";

const legacyGlobals = new Map([
  ["parseInt", "Number.parseInt"],
  ["parseFloat", "Number.parseFloat"],
  ["isNaN", "Number.isNaN"],
  ["isFinite", "Number.isFinite"],
]);

const collectDeclaredNames = (sourceFile: ts.SourceFile) => {
  const names = new Set<string>();

  visit(sourceFile, (node) => {
    if (
      (ts.isVariableDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isParameter(node) ||
        ts.isImportSpecifier(node) ||
        ts.isImportClause(node)) &&
      node.name &&
      ts.isIdentifier(node.name)
    ) {
      names.add(node.name.text);
    }
  });

  return names;
};

export const legacyBuiltinsDetector: Detector = {
  id: "namespace-safe-builtins",
  ruleId: "JS-004",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];
    const declaredNames = collectDeclaredNames(context.sourceFile);

    visit(context.sourceFile, (node) => {
      if (!ts.isCallExpression(node)) {
        return;
      }

      if (ts.isIdentifier(node.expression)) {
        const replacement = legacyGlobals.get(node.expression.text);
        if (!replacement || declaredNames.has(node.expression.text)) {
          return;
        }

        findings.push(
          createFinding(context, node.expression, {
            detectorId: "namespace-safe-builtins",
            message:
              `Legacy global \`${node.expression.text}\` is ambiguous and may coerce values unexpectedly.`,
            ruleId: "JS-004",
            suggestion: `Use \`${replacement}\` instead.`,
          }),
        );
        return;
      }

      if (
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "hasOwnProperty"
      ) {
        findings.push(
          createFinding(context, node.expression.name, {
            detectorId: "namespace-safe-builtins",
            message:
              "Calling `hasOwnProperty` through an object can fail for null-prototype or shadowed objects.",
            ruleId: "JS-004",
            suggestion: "Use `Object.hasOwn(object, key)` instead.",
          }),
        );
      }
    });

    return findings;
  },
};
