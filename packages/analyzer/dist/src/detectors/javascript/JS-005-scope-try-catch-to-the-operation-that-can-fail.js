import ts from "typescript";
import { nodesOfKind } from "../../utils.js";
import { createSourceEvidenceDetector } from "../shared/sourceEvidence.js";
// Only inspect calls whose synchronous failures reach this catch. A nested
// catch owns its try block; its handler and finally still belong to the outer
// boundary. Deferred function bodies have their own execution boundary.
const callsCaughtBy = (block) => {
    const calls = [];
    const visit = (node) => {
        if (ts.isFunctionLike(node))
            return;
        if (ts.isTryStatement(node)) {
            if (!node.catchClause)
                visit(node.tryBlock);
            if (node.catchClause)
                visit(node.catchClause.block);
            if (node.finallyBlock)
                visit(node.finallyBlock);
            return;
        }
        if (ts.isCallExpression(node))
            calls.push(node);
        ts.forEachChild(node, visit);
    };
    visit(block);
    return calls;
};
// Preserve the existing contextual build/render evidence, without treating
// names as proof that the operations are unrelated or the boundary unintended.
const isTransformationCall = (call) => {
    const callee = call.expression;
    const name = ts.isIdentifier(callee)
        ? callee.text
        : ts.isPropertyAccessExpression(callee)
            ? callee.name.text
            : "";
    return name.startsWith("build") || name.startsWith("render");
};
const detector = createSourceEvidenceDetector({
    id: "js_005-evidence",
    ruleId: "JS-005",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: {
        confidence: "contextual",
        impact: "medium",
        contextNote: "This detector uses conservative static evidence for JS-005; review surrounding intent before changing behavior.",
    },
    message: "Scope try/catch to the operation that can fail evidence was detected in this source.",
    suggestion: "Apply JS-005: Scope try/catch to the operation that can fail.",
    find: (context) => nodesOfKind(context, ts.SyntaxKind.TryStatement).flatMap((statement) => {
        // A finally-only boundary does not catch or misclassify any failure.
        if (!statement.catchClause)
            return [];
        const calls = callsCaughtBy(statement.tryBlock);
        if (calls.length < 2 || !calls.some(isTransformationCall))
            return [];
        return [
            {
                start: statement.getStart(context.sourceFile),
                end: statement.tryBlock.getEnd(),
            },
        ];
    }),
});
export const js005Detectors = [detector];
