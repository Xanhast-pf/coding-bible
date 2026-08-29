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

  const { argumentsList, targets } = buildAnalyzerArguments(
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
  assert.deepEqual(argumentsList.slice(argumentsList.indexOf("--config")), [
    "--config",
    "coding-bible.config.ts",
  ]);
});

test("buildAnalyzerArguments rejects explicit targets outside the MCP root", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "coding-bible-mcp-root-"));

  assert.throws(
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
      },
      diagnostics: [],
      findings: [
        {
          detectorId: "no-explicit-any",
          excerpt: "const value: any = input;",
          file: "src/example.ts",
          fingerprint: "abc123",
          fix: { available: false, safety: "none" },
          location: { line: 1, column: 14, endLine: 1, endColumn: 17 },
          message: "Avoid any.",
          ruleId: "TS-001",
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
