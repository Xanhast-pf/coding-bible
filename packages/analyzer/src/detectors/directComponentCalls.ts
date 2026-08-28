import ts from "typescript";

import type { AnalyzerFinding, Detector } from "../types.ts";
import {
  createFinding,
  getFunctionName,
  isExecutableFunction,
  isPascalCaseName,
  visit,
} from "../utils.ts";

const containsJsx = (node: ts.Node) => {
  let found = false;

  visit(node, (child) => {
    if (
      ts.isJsxElement(child) ||
      ts.isJsxSelfClosingElement(child) ||
      ts.isJsxFragment(child)
    ) {
      found = true;
    }
  });

  return found;
};

const collectLocalComponents = (sourceFile: ts.SourceFile) => {
  const components = new Set<string>();

  visit(sourceFile, (node) => {
    if (!isExecutableFunction(node) || !node.body) {
      return;
    }

    const name = getFunctionName(node);
    if (name && isPascalCaseName(name) && containsJsx(node.body)) {
      components.add(name);
    }
  });

  return components;
};

export const directComponentCallsDetector: Detector = {
  id: "react-direct-component-call",
  ruleId: "REACT-010",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];
    const components = collectLocalComponents(context.sourceFile);

    if (!components.size) {
      return findings;
    }

    visit(context.sourceFile, (node) => {
      if (
        !ts.isCallExpression(node) ||
        !ts.isIdentifier(node.expression) ||
        !components.has(node.expression.text)
      ) {
        return;
      }

      findings.push(
        createFinding(context, node, {
          detectorId: "react-direct-component-call",
          message:
            `\`${node.expression.text}\` is a local React component being invoked like a regular function.`,
          ruleId: "REACT-010",
          suggestion: `Render it through JSX instead: \`<${node.expression.text} ... />\`.`,
        }),
      );
    });

    return findings;
  },
};
