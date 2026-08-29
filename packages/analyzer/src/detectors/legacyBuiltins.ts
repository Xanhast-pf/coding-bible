import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import {
  createFinding,
  getSymbol,
  nodesOfKind,
  replaceNodeEdit,
} from "../utils.ts";

const legacyGlobals = new Map([
  ["parseInt", "Number.parseInt"],
  ["parseFloat", "Number.parseFloat"],
  ["isNaN", "Number.isNaN"],
  ["isFinite", "Number.isFinite"],
]);

const isDefaultLibrarySymbol = (
  context: Parameters<typeof getSymbol>[0],
  node: ts.Identifier,
) => {
  const symbol = getSymbol(context, node);
  return Boolean(
    symbol?.declarations?.length &&
    symbol.declarations.every((declaration) =>
      context.program.isSourceFileDefaultLibrary(declaration.getSourceFile()),
    ),
  );
};

const isUnshadowedGlobalIdentifier = (
  context: Parameters<typeof getSymbol>[0],
  node: ts.Identifier,
) => !getSymbol(context, node) || isDefaultLibrarySymbol(context, node);

const isUnshadowedGlobalOwner = (
  context: Parameters<typeof getSymbol>[0],
  node: ts.Expression,
) =>
  ts.isIdentifier(node) &&
  (node.text === "globalThis" || node.text === "window") &&
  isUnshadowedGlobalIdentifier(context, node);

export const legacyBuiltinsDetector: Detector = {
  id: "namespace-safe-builtins",
  ruleId: "JS-004",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    for (const node of nodesOfKind<ts.CallExpression>(
      context,
      ts.SyntaxKind.CallExpression,
    )) {
      if (ts.isIdentifier(node.expression)) {
        const replacement = legacyGlobals.get(node.expression.text);
        if (
          !replacement ||
          !isUnshadowedGlobalIdentifier(context, node.expression)
        ) {
          continue;
        }

        const safety =
          node.expression.text === "parseInt" ||
          node.expression.text === "parseFloat"
            ? "safe"
            : "review";

        findings.push(
          createFinding(context, node.expression, {
            detectorId: "namespace-safe-builtins",
            fix: {
              description:
                safety === "safe"
                  ? `Use the namespaced equivalent \`${replacement}\`.`
                  : `Use \`${replacement}\` only after confirming the code does not rely on the coercion behavior of the legacy global.`,
              edits: [replaceNodeEdit(context, node.expression, replacement)],
              safety,
              title: `Replace with ${replacement}`,
            },
            message: `Legacy global \`${node.expression.text}\` is ambiguous and may coerce values unexpectedly.`,
            ruleId: "JS-004",
            suggestion: `Use \`${replacement}\` instead.`,
          }),
        );
        continue;
      }

      if (!ts.isPropertyAccessExpression(node.expression)) {
        continue;
      }

      const owner = node.expression.expression;
      const method = node.expression.name.text;
      const replacement = legacyGlobals.get(method);

      if (replacement && isUnshadowedGlobalOwner(context, owner)) {
        const safety =
          method === "parseInt" || method === "parseFloat" ? "safe" : "review";

        findings.push(
          createFinding(context, node.expression, {
            detectorId: "namespace-safe-builtins",
            fix: {
              description:
                safety === "safe"
                  ? `Use the namespaced equivalent \`${replacement}\`.`
                  : `Use \`${replacement}\` only after confirming the code does not rely on the coercion behavior of the legacy global.`,
              edits: [replaceNodeEdit(context, node.expression, replacement)],
              safety,
              title: `Replace with ${replacement}`,
            },
            message: `Legacy global \`${owner.getText(context.sourceFile)}.${method}\` uses the coercive global API.`,
            ruleId: "JS-004",
            suggestion: `Use \`${replacement}\` instead.`,
          }),
        );
        continue;
      }

      if (method === "hasOwnProperty") {
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
    }

    return findings;
  },
};
