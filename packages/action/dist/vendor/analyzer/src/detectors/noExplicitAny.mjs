import ts from "../../../typescript/typescript.cjs";
import { createFinding, visit } from "../utils.mjs";
export const noExplicitAnyDetector = {
    id: "no-explicit-any",
    languages: ["ts", "tsx"],
    ruleId: "TS-001",
    analyze: (context) => {
        const findings = [];
        visit(context.sourceFile, (node) => {
            if (node.kind !== ts.SyntaxKind.AnyKeyword) {
                return;
            }
            findings.push(createFinding(context, node, {
                detectorId: "no-explicit-any",
                message: "Explicit `any` disables TypeScript's safety at this boundary.",
                ruleId: "TS-001",
                suggestion: "Use the narrowest correct type, or `unknown` until the value is validated.",
            }));
        });
        return findings;
    },
};
