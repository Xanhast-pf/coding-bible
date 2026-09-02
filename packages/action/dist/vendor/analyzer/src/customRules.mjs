import ts from "../../typescript/typescript.cjs";
import { analyzerFindingConfidences, analyzerFindingImpacts, analyzerLanguages, } from "./types.mjs";
import { createFinding, nodesOfKind } from "./utils.mjs";
export const analyzerCustomRuleBookFormatVersion = 1;
const validCustomRuleBookKeys = new Set(["formatVersion", "name", "rules"]);
const customRuleIdPattern = /^[A-Z][A-Z0-9]*-\d{3}$/u;
const validConfidences = new Set(analyzerFindingConfidences);
const validImpacts = new Set(analyzerFindingImpacts);
const validLanguages = new Set(analyzerLanguages);
const isAnalyzerFindingConfidence = (value) => validConfidences.has(value);
const isAnalyzerFindingImpact = (value) => validImpacts.has(value);
const toRecord = (value, message) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(message);
    }
    return value;
};
const requireText = (value, name) => {
    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`${name} must be a non-empty string.`);
    }
    return value;
};
const validateMatch = (value, name) => {
    const match = toRecord(value, `${name} must be an object.`);
    if (match.kind === "import") {
        const source = requireText(match.source, `${name}.source`);
        if (match.mode !== undefined &&
            match.mode !== "exact" &&
            match.mode !== "prefix") {
            throw new Error(`${name}.mode must be "exact" or "prefix".`);
        }
        return {
            kind: "import",
            ...(match.mode === undefined ? {} : { mode: match.mode }),
            source,
        };
    }
    if (match.kind === "call") {
        return {
            callee: requireText(match.callee, `${name}.callee`),
            kind: "call",
        };
    }
    throw new Error(`${name}.kind must be one of the supported declarative matchers: "import" or "call".`);
};
export const validateAnalyzerCustomRules = (value, name = "customRules") => {
    if (value === undefined)
        return [];
    if (!Array.isArray(value)) {
        throw new Error(`${name} must be an array.`);
    }
    const seenIds = new Set();
    return value.map((item, index) => {
        const itemName = `${name}[${index}]`;
        const rule = toRecord(item, `${itemName} must be an object.`);
        const id = requireText(rule.id, `${itemName}.id`).toUpperCase();
        if (!customRuleIdPattern.test(id)) {
            throw new Error(`${itemName}.id must match PREFIX-000.`);
        }
        if (seenIds.has(id)) {
            throw new Error(`${itemName}.id duplicates custom rule "${id}".`);
        }
        seenIds.add(id);
        const confidence = rule.confidence;
        if (!isAnalyzerFindingConfidence(confidence)) {
            throw new Error(`${itemName}.confidence must be "certain", "strong", or "contextual".`);
        }
        const impact = rule.impact;
        if (!isAnalyzerFindingImpact(impact)) {
            throw new Error(`${itemName}.impact must be "high", "medium", or "low".`);
        }
        const contextNote = rule.contextNote === undefined
            ? undefined
            : requireText(rule.contextNote, `${itemName}.contextNote`);
        if (confidence === "contextual" && !contextNote) {
            throw new Error(`${itemName}.contextNote is required for contextual findings.`);
        }
        let languages;
        if (rule.languages !== undefined) {
            if (!Array.isArray(rule.languages) ||
                rule.languages.length === 0 ||
                rule.languages.some((language) => !validLanguages.has(language))) {
                throw new Error(`${itemName}.languages must contain one or more of: ${analyzerLanguages.join(", ")}.`);
            }
            languages = [
                ...new Set(rule.languages),
            ];
        }
        const url = rule.url === undefined
            ? undefined
            : requireText(rule.url, `${itemName}.url`);
        if (url && !url.startsWith("https://")) {
            throw new Error(`${itemName}.url must use HTTPS.`);
        }
        return {
            confidence,
            ...(contextNote ? { contextNote } : {}),
            id,
            impact,
            ...(languages ? { languages } : {}),
            match: validateMatch(rule.match, `${itemName}.match`),
            message: requireText(rule.message, `${itemName}.message`),
            rationale: requireText(rule.rationale, `${itemName}.rationale`),
            suggestion: requireText(rule.suggestion, `${itemName}.suggestion`),
            title: requireText(rule.title, `${itemName}.title`),
            ...(url ? { url } : {}),
        };
    });
};
export const validateAnalyzerCustomRuleBook = (value, sourceName = "custom rulebook") => {
    const book = toRecord(value, `${sourceName} must be an object.`);
    for (const key of Object.keys(book)) {
        if (!validCustomRuleBookKeys.has(key)) {
            throw new Error(`${sourceName} contains unknown option "${key}".`);
        }
    }
    if (book.formatVersion !== analyzerCustomRuleBookFormatVersion) {
        throw new Error(`${sourceName}.formatVersion must be ${analyzerCustomRuleBookFormatVersion}.`);
    }
    const name = requireText(book.name, `${sourceName}.name`);
    const rules = validateAnalyzerCustomRules(book.rules, `${sourceName}.rules`);
    if (!rules.length) {
        throw new Error(`${sourceName}.rules must contain at least one rule.`);
    }
    return {
        formatVersion: analyzerCustomRuleBookFormatVersion,
        name,
        rules,
    };
};
export const defineCustomRule = (rule) => rule;
export const defineCustomRuleBook = (ruleBook) => ruleBook;
export const defineDetector = (detector) => detector;
const moduleMatches = (actual, expected, mode = "exact") => (mode === "prefix" ? actual.startsWith(expected) : actual === expected);
const createRuleFinding = (rule, detectorId, context, node) => createFinding(context, node, {
    detectorId,
    message: rule.message,
    ruleId: rule.id,
    ruleRationale: rule.rationale,
    ruleTitle: rule.title,
    ...(rule.url ? { ruleUrl: rule.url } : {}),
    suggestion: rule.suggestion,
});
const createImportDetector = (rule) => {
    const detectorId = `custom-rule-${rule.id.toLowerCase()}-import`;
    return {
        dependencyScope: "source-file",
        id: detectorId,
        ...(rule.languages ? { languages: rule.languages } : {}),
        profile: {
            confidence: rule.confidence,
            ...(rule.contextNote ? { contextNote: rule.contextNote } : {}),
            impact: rule.impact,
        },
        ruleId: rule.id,
        analyze: (context) => {
            const findings = [];
            for (const node of nodesOfKind(context, ts.SyntaxKind.ImportDeclaration)) {
                if (ts.isStringLiteral(node.moduleSpecifier) &&
                    moduleMatches(node.moduleSpecifier.text, rule.match.source, rule.match.mode)) {
                    findings.push(createRuleFinding(rule, detectorId, context, node.moduleSpecifier));
                }
            }
            for (const node of nodesOfKind(context, ts.SyntaxKind.ExportDeclaration)) {
                if (node.moduleSpecifier &&
                    ts.isStringLiteral(node.moduleSpecifier) &&
                    moduleMatches(node.moduleSpecifier.text, rule.match.source, rule.match.mode)) {
                    findings.push(createRuleFinding(rule, detectorId, context, node.moduleSpecifier));
                }
            }
            return findings;
        },
    };
};
const createCallDetector = (rule) => {
    const detectorId = `custom-rule-${rule.id.toLowerCase()}-call`;
    return {
        dependencyScope: "source-file",
        id: detectorId,
        ...(rule.languages ? { languages: rule.languages } : {}),
        profile: {
            confidence: rule.confidence,
            ...(rule.contextNote ? { contextNote: rule.contextNote } : {}),
            impact: rule.impact,
        },
        ruleId: rule.id,
        analyze: (context) => {
            const findings = [];
            for (const node of nodesOfKind(context, ts.SyntaxKind.CallExpression)) {
                if (node.expression.getText(context.sourceFile) !== rule.match.callee) {
                    continue;
                }
                findings.push(createRuleFinding(rule, detectorId, context, node.expression));
            }
            return findings;
        },
    };
};
export const createAnalyzerCustomRuleDetectors = (value) => validateAnalyzerCustomRules(value).map((rule) => rule.match.kind === "import"
    ? createImportDetector(rule)
    : createCallDetector(rule));
