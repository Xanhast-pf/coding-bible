import { createHash } from "node:crypto";

import { actionVersion, canonicalBaseUrl } from "./constants.mjs";
import { resolveFindingRule } from "./ruleCatalog.mjs";

const syntaxRuleId = "CODING-BIBLE-SYNTAX";

const fingerprint = (parts) =>
  createHash("sha256").update(parts.join("\0")).digest("hex").slice(0, 24);

const toRegion = (location) => ({
  startLine: location.line,
  startColumn: location.column,
  endLine: location.endLine,
  endColumn: location.endColumn,
});

const toRuleDescriptor = (rule) => ({
  id: rule.id,
  name: rule.title,
  shortDescription: { text: rule.summary },
  ...(rule.url ? { helpUri: rule.url } : {}),
  properties: {
    source: rule.source,
    ...(rule.level ? { level: rule.level } : {}),
    ...(rule.pack ? { pack: rule.pack } : {}),
    ...(rule.status ? { status: rule.status } : {}),
  },
});

export const createSarif = ({ diagnostics, findings, rulesById }) => {
  const findingRules = new Map();
  for (const finding of findings) {
    if (!findingRules.has(finding.ruleId)) {
      findingRules.set(
        finding.ruleId,
        resolveFindingRule(finding, rulesById, canonicalBaseUrl),
      );
    }
  }
  const rules = [...findingRules.values()]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(toRuleDescriptor);

  if (diagnostics.length) {
    rules.unshift({
      id: syntaxRuleId,
      name: "Syntax diagnostic",
      shortDescription: {
        text: "The source could not be parsed cleanly by the Coding Bible analyzer.",
      },
    });
  }

  const findingResults = findings.map((finding) => ({
    ruleId: finding.ruleId,
    level: finding.severity === "error" ? "error" : "warning",
    message: {
      text: `${finding.message} ${finding.suggestion}${finding.contextNote ? ` ${finding.confidence === "contextual" ? "Context required" : "Analyzer note"}: ${finding.contextNote}` : ""}`,
    },
    properties: {
      confidence: finding.confidence,
      impact: finding.impact,
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: finding.filePath.replaceAll("\\", "/") },
          region: toRegion(finding.location),
        },
      },
    ],
    partialFingerprints: {
      codingBibleFinding: fingerprint([
        finding.ruleId,
        finding.filePath,
        finding.excerpt,
        finding.message,
      ]),
    },
  }));

  const diagnosticResults = diagnostics.map((diagnostic) => ({
    ruleId: syntaxRuleId,
    level: "error",
    message: { text: diagnostic.message },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: diagnostic.filePath.replaceAll("\\", "/") },
          region: toRegion(diagnostic.location),
        },
      },
    ],
    partialFingerprints: {
      codingBibleDiagnostic: fingerprint([
        syntaxRuleId,
        diagnostic.filePath,
        diagnostic.excerpt,
        diagnostic.message,
      ]),
    },
  }));

  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "Coding Bible",
            informationUri: canonicalBaseUrl,
            semanticVersion: actionVersion,
            rules,
          },
        },
        results: [...findingResults, ...diagnosticResults],
      },
    ],
  };
};
