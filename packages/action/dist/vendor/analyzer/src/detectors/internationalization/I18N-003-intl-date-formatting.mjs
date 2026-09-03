import ts from "../../../../typescript/typescript.cjs";
import { createFinding, nodesOfKind } from "../../utils.mjs";
const localeSensitiveDateMethods = new Set([
    "getDate",
    "getDay",
    "getFullYear",
    "getHours",
    "getMinutes",
    "getMonth",
    "getSeconds",
]);
const receiverTextForDateGetter = (context, node) => {
    if (node.arguments.length !== 0 ||
        !ts.isPropertyAccessExpression(node.expression) ||
        !localeSensitiveDateMethods.has(node.expression.name.text)) {
        return null;
    }
    return node.expression.expression.getText(context.sourceFile);
};
const collectDateGetterReceivers = (context, node) => {
    const receivers = new Map();
    const visit = (current) => {
        if (ts.isCallExpression(current)) {
            const receiver = receiverTextForDateGetter(context, current);
            if (receiver && ts.isPropertyAccessExpression(current.expression)) {
                const methods = receivers.get(receiver) ?? new Set();
                methods.add(current.expression.name.text);
                receivers.set(receiver, methods);
            }
        }
        ts.forEachChild(current, visit);
    };
    visit(node);
    return receivers;
};
const hasLikelyManualDateFormat = (context, node) => [...collectDateGetterReceivers(context, node).values()].some((methods) => methods.size >= 2);
const containsStringLiteral = (node) => {
    let found = false;
    const visit = (current) => {
        if (found)
            return;
        if (ts.isStringLiteral(current) ||
            ts.isNoSubstitutionTemplateLiteral(current)) {
            found = true;
            return;
        }
        ts.forEachChild(current, visit);
    };
    visit(node);
    return found;
};
const findingFor = (context, node) => createFinding(context, node, {
    detectorId: "i18n-manual-date-format",
    message: "Date/time parts are assembled manually into a locale-sensitive display string.",
    ruleId: "I18N-003",
    suggestion: "Use Intl.DateTimeFormat (or another Intl formatter appropriate to the value) so locale rules are explicit.",
});
export const i18n003ManualDateFormatDetector = {
    dependencyScope: "source-file",
    id: "i18n-manual-date-format",
    profile: {
        confidence: "contextual",
        contextNote: "Fixed machine, protocol, log, or storage formats can intentionally avoid locale formatting. Confirm the value is user-facing before changing it.",
        impact: "medium",
    },
    ruleId: "I18N-003",
    analyze: (context) => {
        const findings = [];
        for (const node of nodesOfKind(context, ts.SyntaxKind.TemplateExpression)) {
            if (hasLikelyManualDateFormat(context, node)) {
                findings.push(findingFor(context, node));
            }
        }
        for (const node of nodesOfKind(context, ts.SyntaxKind.BinaryExpression)) {
            if (node.operatorToken.kind !== ts.SyntaxKind.PlusToken ||
                (ts.isBinaryExpression(node.parent) &&
                    node.parent.operatorToken.kind === ts.SyntaxKind.PlusToken) ||
                !containsStringLiteral(node) ||
                !hasLikelyManualDateFormat(context, node)) {
                continue;
            }
            findings.push(findingFor(context, node));
        }
        return findings;
    },
};
export const i18n003Detectors = [
    i18n003ManualDateFormatDetector,
];
