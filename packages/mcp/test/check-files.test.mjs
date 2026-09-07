import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildAnalyzerArguments,
  checkFiles,
  parseAnalyzerReport,
} from "../src/checkFiles.ts";

test("buildAnalyzerArguments keeps scans read-only and root-bound", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "coding-bible-mcp-files-"));
  await mkdir(path.join(root, "src"));
  await writeFile(
    path.join(root, "coding-bible.config.ts"),
    "export default {};\n",
  );

  const { argumentsList, targets } = await buildAnalyzerArguments(
    {
      paths: ["src"],
      configPath: "coding-bible.config.ts",
      ignoreBaseline: true,
    },
    root,
  );

  assert.deepEqual(targets, ["src"]);
  assert.ok(argumentsList.includes("--json"));
  assert.ok(argumentsList.includes("--no-cache"));
  assert.ok(argumentsList.includes("--no-baseline"));
  assert.deepEqual(
    argumentsList.slice(
      argumentsList.indexOf("--boundary-root"),
      argumentsList.indexOf("--boundary-root") + 2,
    ),
    ["--boundary-root", "."],
  );
  assert.deepEqual(argumentsList.slice(argumentsList.indexOf("--config")), [
    "--config",
    "coding-bible.config.ts",
  ]);
});

test("buildAnalyzerArguments rejects explicit targets outside the MCP root", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "coding-bible-mcp-root-"));

  await assert.rejects(
    () => buildAnalyzerArguments({ paths: ["../outside"] }, root),
    /configured MCP root/,
  );
});

test("checkFiles delegates to the project analyzer without writing its cache", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "coding-bible-mcp-scan-"));
  await mkdir(path.join(root, "src"));
  await writeFile(
    path.join(root, "src", "unsafe.ts"),
    "export const parse = (value: any) => value;\n",
  );

  const result = await checkFiles({ paths: ["src"] }, { rootDirectory: root });

  assert.equal(result.kind, "file-check");
  assert.equal(result.analyzer.summary.filesAnalyzed, 1);
  assert.equal(result.analyzer.findings.length, 1);
  assert.equal(result.analyzer.findings[0]?.ruleId, "TS-001");
  assert.equal(result.ruleReferences[0]?.id, "TS-001");
  assert.match(result.coverageNote, /deterministic/);
  await assert.rejects(
    () => access(path.join(root, ".coding-bible", "cache")),
    /ENOENT/,
  );
});

test("parseAnalyzerReport accepts the full versioned analyzer contract", () => {
  const report = parseAnalyzerReport(
    JSON.stringify({
      schemaVersion: 1,
      summary: {
        baselineSuppressed: 0,
        cacheHits: 0,
        cacheMisses: 2,
        diagnostics: 0,
        errors: 1,
        filesDiscovered: 2,
        filesAnalyzed: 2,
        findings: 1,
        reviewFixes: 0,
        rulesChecked: 20,
        safeFixes: 0,
        warnings: 0,
        confidence: { certain: 0, strong: 0, contextual: 1 },
        impact: { high: 0, medium: 1, low: 0 },
      },
      diagnostics: [],
      findings: [
        {
          confidence: "contextual",
          contextNote: "Review the interoperability boundary.",
          detectorId: "no-explicit-any",
          excerpt: "const value: any = input;",
          file: "src/example.ts",
          fingerprint: "abc123",
          fix: { available: false, safety: "none" },
          location: { line: 1, column: 14, endLine: 1, endColumn: 17 },
          impact: "medium",
          message: "Avoid any.",
          ruleId: "TS-001",
          ruleRationale: "Keep type boundaries explicit.",
          ruleTitle: "Avoid any",
          ruleUrl: "https://example.com/#TS-001",
          severity: "error",
          suggestion: "Use unknown.",
        },
      ],
    }),
  );

  assert.equal(report.summary.filesAnalyzed, 2);
  assert.equal(report.summary.cacheMisses, 2);
  assert.equal(report.findings.length, 1);
  assert.equal(report.findings[0]?.file, "src/example.ts");
  assert.equal(report.findings[0]?.confidence, "contextual");
  assert.equal(report.findings[0]?.impact, "medium");
  assert.equal(report.findings[0]?.ruleTitle, "Avoid any");
  assert.equal(
    report.findings[0]?.contextNote,
    "Review the interoperability boundary.",
  );
  assert.deepEqual(report.summary.confidence, {
    certain: 0,
    strong: 0,
    contextual: 1,
  });
});

test("parseAnalyzerReport rejects incompatible reports", () => {
  assert.throws(
    () =>
      parseAnalyzerReport(
        JSON.stringify({ schemaVersion: 2, diagnostics: [], findings: [] }),
      ),
    /unsupported JSON report/,
  );
});

test("checkFiles preserves self-describing custom-rule findings and references", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-mcp-custom-"),
  );
  await mkdir(path.join(root, "src"));
  await writeFile(
    path.join(root, "coding-bible.config.json"),
    JSON.stringify({
      customRules: [
        {
          id: "ACME-001",
          title: "Avoid dangerous",
          rationale: "The project forbids the dangerous helper.",
          message: "Do not call dangerous().",
          suggestion: "Use safeAlternative().",
          confidence: "strong",
          impact: "high",
          url: "https://example.com/rules/ACME-001",
          match: { kind: "call", callee: "dangerous" },
        },
      ],
    }),
  );
  await writeFile(path.join(root, "src", "example.ts"), "dangerous();\n");

  const result = await checkFiles({ paths: ["src"] }, { rootDirectory: root });
  const finding = result.analyzer.findings.find(
    ({ ruleId }) => ruleId === "ACME-001",
  );
  const reference = result.ruleReferences.find(({ id }) => id === "ACME-001");

  assert.ok(finding);
  assert.equal(finding.ruleTitle, "Avoid dangerous");
  assert.equal(
    finding.ruleRationale,
    "The project forbids the dangerous helper.",
  );
  assert.equal(finding.ruleUrl, "https://example.com/rules/ACME-001");
  assert.equal(finding.confidence, "strong");
  assert.equal(finding.impact, "high");
  assert.deepEqual(reference, {
    id: "ACME-001",
    level: null,
    pack: null,
    source: "finding",
    status: null,
    summary: "The project forbids the dangerous helper.",
    title: "Avoid dangerous",
    url: "https://example.com/rules/ACME-001",
  });
});

test("checkFiles does not discover Coding Bible config above the MCP root", async () => {
  const parent = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-mcp-boundary-config-"),
  );
  const root = path.join(parent, "project");
  await mkdir(path.join(root, "src"), { recursive: true });
  await writeFile(
    path.join(parent, "coding-bible.config.json"),
    JSON.stringify({
      customRules: [
        {
          id: "ACME-001",
          title: "Ancestor rule",
          rationale: "Must not be loaded across the MCP boundary.",
          message: "Ancestor rule fired.",
          suggestion: "Do not load this config.",
          confidence: "certain",
          impact: "high",
          match: { kind: "call", callee: "dangerous" },
        },
      ],
    }),
  );
  await writeFile(path.join(root, "src", "example.ts"), "dangerous();\n");

  const result = await checkFiles({ paths: ["src"] }, { rootDirectory: root });

  assert.equal(
    result.analyzer.findings.some(({ ruleId }) => ruleId === "ACME-001"),
    false,
  );
});
