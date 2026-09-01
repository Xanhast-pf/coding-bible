import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../../types.ts";
import {
  createFinding,
  hasSourceFileDeclaration,
  nodesOfKind,
  replaceNodeEdit,
} from "../../utils.ts";

const legacyGlobals = new Map([
  ["parseInt", "Number.parseInt"],
  ["parseFloat", "Number.parseFloat"],
  ["isNaN", "Number.isNaN"],
  ["isFinite", "Number.isFinite"],
]);

const getLegacyGlobalMessage = (method: string, displayName: string) =>
  method === "parseInt" || method === "parseFloat"
    ? `Global \`${displayName}\` has a direct namespaced equivalent with the same parsing semantics.`
    : `Legacy global \`${displayName}\` coerces values before testing them.`;

const isUnshadowedGlobalIdentifier = (
  context: Parameters<typeof hasSourceFileDeclaration>[0],
  node: ts.Identifier,
) => !hasSourceFileDeclaration(context, node);

const isUnshadowedGlobalOwner = (
  context: Parameters<typeof hasSourceFileDeclaration>[0],
  node: ts.Expression,
) =>
  ts.isIdentifier(node) &&
  (node.text === "globalThis" || node.text === "window") &&
  isUnshadowedGlobalIdentifier(context, node);

export const js004NamespaceSafeBuiltinsDetector: Detector = {
  dependencyScope: "source-file",
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
            message: getLegacyGlobalMessage(
              node.expression.text,
              node.expression.text,
            ),
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
            message: getLegacyGlobalMessage(
              method,
              `${owner.getText(context.sourceFile)}.${method}`,
            ),
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

export const js004Detectors = [
  js004NamespaceSafeBuiltinsDetector,
] satisfies readonly Detector[];
