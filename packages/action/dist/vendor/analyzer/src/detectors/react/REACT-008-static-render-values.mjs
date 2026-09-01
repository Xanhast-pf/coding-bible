import ts from "../../../../typescript/typescript.cjs";
import { createFinding, getReferences, getSymbol, isExecutableFunction, unwrapExpression, visit, } from "../../utils.mjs";
import { isComponentFunction, mutatingCollectionMethods, } from "./_componentFunctions.mjs";
const isStaticExpression = (expression) => {
    const candidate = unwrapExpression(expression);
    if (ts.isStringLiteral(candidate) ||
        ts.isNoSubstitutionTemplateLiteral(candidate) ||
        ts.isNumericLiteral(candidate) ||
        candidate.kind === ts.SyntaxKind.TrueKeyword ||
        candidate.kind === ts.SyntaxKind.FalseKeyword ||
        candidate.kind === ts.SyntaxKind.NullKeyword) {
        return true;
    }
    if (ts.isPrefixUnaryExpression(candidate)) {
        return isStaticExpression(candidate.operand);
    }
    if (ts.isArrayLiteralExpression(candidate)) {
        return candidate.elements.every((element) => !ts.isSpreadElement(element) && isStaticExpression(element));
    }
    if (ts.isObjectLiteralExpression(candidate)) {
        return candidate.properties.every((property) => {
            if (!ts.isPropertyAssignment(property)) {
                return false;
            }
            if (ts.isComputedPropertyName(property.name) &&
                !isStaticExpression(property.name.expression)) {
                return false;
            }
            return isStaticExpression(property.initializer);
        });
    }
    return false;
};
const identifierIsMutated = (context, identifier) => {
    const symbol = getSymbol(context, identifier);
    if (!symbol) {
        return true;
    }
    return getReferences(context, identifier).some((reference) => {
        if (reference === identifier) {
            return false;
        }
        const parent = reference.parent;
        if (ts.isPropertyAccessExpression(parent) &&
            parent.expression === reference &&
            ts.isCallExpression(parent.parent) &&
            parent.parent.expression === parent &&
            mutatingCollectionMethods.has(parent.name.text)) {
            return true;
        }
        let current = reference;
        while (current.parent && !ts.isStatement(current.parent)) {
            const owner = current.parent;
            if (ts.isBinaryExpression(owner) &&
                owner.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
                owner.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
                reference.pos >= owner.left.pos &&
                reference.end <= owner.left.end) {
                return true;
            }
            if ((ts.isPrefixUnaryExpression(owner) ||
                ts.isPostfixUnaryExpression(owner)) &&
                (owner.operator === ts.SyntaxKind.PlusPlusToken ||
                    owner.operator === ts.SyntaxKind.MinusMinusToken)) {
                return true;
            }
            current = owner;
        }
        return false;
    });
};
export const react008StaticComponentValueDetector = {
    dependencyScope: "source-file",
    id: "react-static-component-value",
    languages: ["js", "jsx", "tsx"],
    ruleId: "REACT-008",
    analyze: (context) => {
        const findings = [];
        visit(context.sourceFile, (node) => {
            if (!isComponentFunction(node) ||
                !isExecutableFunction(node) ||
                !node.body) {
                return;
            }
            const inspect = (child) => {
                if (child !== node && isExecutableFunction(child)) {
                    return;
                }
                if (ts.isVariableDeclaration(child) &&
                    ts.isIdentifier(child.name) &&
                    child.initializer &&
                    (ts.isArrayLiteralExpression(unwrapExpression(child.initializer)) ||
                        ts.isObjectLiteralExpression(unwrapExpression(child.initializer))) &&
                    isStaticExpression(child.initializer) &&
                    !identifierIsMutated(context, child.name)) {
                    findings.push(createFinding(context, child.name, {
                        detectorId: "react-static-component-value",
                        message: `\`${child.name.text}\` is recreated on every render even though its value is context-free.`,
                        ruleId: "REACT-008",
                        suggestion: "Move this static array/object to module scope.",
                    }));
                }
                child.forEachChild(inspect);
            };
            node.body.forEachChild(inspect);
        });
        return findings;
    },
};
export const react008Detectors = [
    react008StaticComponentValueDetector,
];
