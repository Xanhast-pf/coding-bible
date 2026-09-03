import ts from "typescript";

import type {
  AnalyzerFinding,
  Detector,
  DetectorContext,
} from "../../types.ts";
import { createFinding } from "../../utils.ts";

interface ObservableSetCall {
  propertyName: string;
  rootName: string;
  statement: ts.ExpressionStatement;
}

const observableSetCall = (
  statement: ts.Statement,
): ObservableSetCall | null => {
  if (
    !ts.isExpressionStatement(statement) ||
    !ts.isCallExpression(statement.expression) ||
    !ts.isPropertyAccessExpression(statement.expression.expression) ||
    statement.expression.expression.name.text !== "set"
  ) {
    return null;
  }

  const receiver = statement.expression.expression.expression;
  if (
    !ts.isPropertyAccessExpression(receiver) ||
    !ts.isIdentifier(receiver.expression) ||
    !receiver.expression.text.endsWith("$")
  ) {
    return null;
  }

  return {
    propertyName: receiver.name.text,
    rootName: receiver.expression.text,
    statement,
  };
};

const inspectStatementList = (
  context: DetectorContext,
  statements: readonly ts.Statement[],
  findings: AnalyzerFinding[],
) => {
  for (let index = 1; index < statements.length; index += 1) {
    const previousStatement = statements[index - 1];
    const currentStatement = statements[index];
    if (!previousStatement || !currentStatement) continue;

    const previous = observableSetCall(previousStatement);
    const current = observableSetCall(currentStatement);

    if (
      !previous ||
      !current ||
      previous.rootName !== current.rootName ||
      previous.propertyName === current.propertyName
    ) {
      continue;
    }

    findings.push(
      createFinding(context, current.statement, {
        detectorId: "legend-batch-sibling-updates",
        message: `Sibling observable updates on ${current.rootName} are performed as separate set() calls.`,
        ruleId: "LEGEND-004",
        suggestion: `Batch sibling updates with ${current.rootName}.assign({ ... }) when they represent one logical state transition.`,
      }),
    );
  }
};

export const legend004BatchSiblingUpdatesDetector: Detector = {
  dependencyScope: "source-file",
  id: "legend-batch-sibling-updates",
  profile: {
    confidence: "strong",
    contextNote:
      "Separate updates can be intentional when observers must see intermediate states or the writes are separate logical events. Confirm they form one state transition before batching.",
    impact: "medium",
  },
  ruleId: "LEGEND-004",
  analyze: (context) => {
    const findings: AnalyzerFinding[] = [];

    inspectStatementList(context, context.sourceFile.statements, findings);

    const visit = (node: ts.Node) => {
      if (ts.isBlock(node)) {
        inspectStatementList(context, node.statements, findings);
      }
      ts.forEachChild(node, visit);
    };
    ts.forEachChild(context.sourceFile, visit);

    return findings;
  },
};

export const legend004Detectors = [
  legend004BatchSiblingUpdatesDetector,
] satisfies readonly Detector[];
