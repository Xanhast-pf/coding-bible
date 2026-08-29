import {
  analyze,
  type AnalyzerDiagnostic,
  type AnalyzerFinding,
  type AnalyzerLanguage,
} from "@coding-bible/analyzer";

import { codingBibleCanonicalUrl } from "./constants.ts";
import { createRuleReference, type McpRuleReference } from "./ruleReference.ts";

export interface CheckCodeInput {
  code: string;
  language: AnalyzerLanguage;
  fileName?: string;
}

export interface McpCodeFinding extends AnalyzerFinding {
  rule: McpRuleReference;
}

export interface CheckCodeResult {
  schemaVersion: 1;
  kind: "code-check";
  fileName: string;
  summary: {
    checksRun: number;
    diagnostics: number;
    findings: number;
    rulesChecked: number;
  };
  diagnostics: readonly AnalyzerDiagnostic[];
  findings: readonly McpCodeFinding[];
  ruleIdsChecked: readonly string[];
  coverageNote: string;
}

const defaultFileNameByLanguage = {
  js: "snippet.js",
  jsx: "snippet.jsx",
  ts: "snippet.ts",
  tsx: "snippet.tsx",
} satisfies Record<AnalyzerLanguage, string>;

export const checkCode = (
  input: CheckCodeInput,
  { canonicalBaseUrl = codingBibleCanonicalUrl } = {},
): CheckCodeResult => {
  const fileName = input.fileName ?? defaultFileNameByLanguage[input.language];
  const result = analyze({
    fileName,
    language: input.language,
    source: input.code,
  });

  return {
    schemaVersion: 1,
    kind: "code-check",
    fileName,
    summary: {
      checksRun: result.checksRun,
      diagnostics: result.diagnostics.length,
      findings: result.findings.length,
      rulesChecked: result.ruleIdsChecked.length,
    },
    diagnostics: result.diagnostics,
    findings: result.findings.map((finding) => ({
      ...finding,
      rule: createRuleReference(finding.ruleId, canonicalBaseUrl),
    })),
    ruleIdsChecked: result.ruleIdsChecked,
    coverageNote:
      "A clean result covers only implemented deterministic analyzer rules; semantic Coding Bible rules still require review.",
  };
};
