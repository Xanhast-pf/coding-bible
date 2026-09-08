import ts from "typescript";
import { createFinding, nodesOfKind } from "../../utils.js";
const policyName = /(?:attempts|retries|limit|threshold|timeout|count)/i;
const compareKinds = new Set([
    ts.SyntaxKind.GreaterThanEqualsToken,
    ts.SyntaxKind.GreaterThanToken,
    ts.SyntaxKind.EqualsEqualsToken,
    ts.SyntaxKind.EqualsEqualsEqualsToken,
]);
const detector = {
    dependencyScope: "source-file",
    id: "core_006-policy-magic-number",
    ruleId: "CORE-006",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: {
        confidence: "strong",
        impact: "medium",
    },
    analyze: (context) => nodesOfKind(context, ts.SyntaxKind.BinaryExpression)
        .filter((node) => {
        if (!compareKinds.has(node.operatorToken.kind))
            return false;
        const left = node.left.getText(context.sourceFile);
        if (!policyName.test(left))
            return false;
        if (!ts.isNumericLiteral(node.right))
            return false;
        const value = Number(node.right.text);
        return Number.isFinite(value) && value !== 0 && value !== 1;
    })
        .map((node) => createFinding(context, node.right, {
        detectorId: "core_006-policy-magic-number",
        ruleId: "CORE-006",
        message: "A policy-like comparison uses an unexplained numeric threshold.",
        suggestion: "Name the threshold so its policy meaning is explicit and easy to change.",
    })),
};
export const core006Detectors = [detector];
