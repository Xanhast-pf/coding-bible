import ts from "../../../typescript/typescript.cjs";
import { createFinding, nodesOfKind } from "../utils.mjs";
const isAssertion = (node) => ts.isAsExpression(node) || ts.isTypeAssertionExpression(node);
const isUnknownType = (type) => (type.flags & ts.TypeFlags.Unknown) !== 0;
const isUnknownTypeNode = (node) => node.kind === ts.SyntaxKind.UnknownKeyword;
const getTargetText = (node, sourceFile) => node.type.getText(sourceFile);
export const unsafeUnknownAssertionDetector = {
    dependencyScope: "source-file",
    id: "unknown-type-assertion",
    languages: ["ts", "tsx"],
    ruleId: "TS-007",
    analyze: (context) => {
        const findings = [];
        const assertions = [
            ...nodesOfKind(context, ts.SyntaxKind.AsExpression),
            ...nodesOfKind(context, ts.SyntaxKind.TypeAssertionExpression),
        ];
        for (const node of assertions) {
            if (isUnknownTypeNode(node.type)) {
                continue;
            }
            const sourceType = context.checker.getTypeAtLocation(node.expression);
            const explicitlyBridgedThroughUnknown = isAssertion(node.expression) && isUnknownTypeNode(node.expression.type);
            if (!isUnknownType(sourceType) && !explicitlyBridgedThroughUnknown) {
                continue;
            }
            const target = getTargetText(node, context.sourceFile);
            findings.push(createFinding(context, node, {
                detectorId: "unknown-type-assertion",
                message: `An \`unknown\` value is asserted directly to \`${target}\` without narrowing or validation.`,
                ruleId: "TS-007",
                suggestion: "Narrow or validate the value first so the compiler can prove the target type instead of forcing the assertion.",
            }));
        }
        return findings;
    },
};
