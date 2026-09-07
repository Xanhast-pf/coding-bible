# Analyzer report schema v1

Coding Bible keeps analyzer evidence separate from proposed source changes. The
report is JSON; proposed edits are standard Git unified patches.

## Files

```text
.coding-bible/
  report.json
  safe-fixes.patch
  review-fixes.patch
```

`review-fixes.patch` is created only when `--include-review-fixes` is requested.
Generated artifacts are ignored by Coding Bible discovery and by this repository.

## Cross-runtime contract

`schemaVersion: 1` defines a shared report core used by the CLI, browser analyzer,
MCP parser, and downstream integrations. Runtime-specific top-level metadata may
be added, but the following fields keep the same meaning everywhere:

- `summary`
- `diagnostics`
- `findings`

The TypeScript contract lives in
`packages/analyzer/src/reportTypes.ts`. Integrations should consume that contract
instead of independently narrowing analyzer JSON.

The common summary includes file/rule/finding counts plus confidence and impact
breakdowns:

```json
{
  "baselineSuppressed": 0,
  "cacheHits": 0,
  "cacheMisses": 7,
  "diagnostics": 0,
  "errors": 2,
  "filesDiscovered": 84,
  "filesAnalyzed": 7,
  "findings": 4,
  "reviewFixes": 1,
  "rulesChecked": 27,
  "safeFixes": 1,
  "warnings": 2,
  "confidence": {
    "certain": 2,
    "strong": 1,
    "contextual": 1
  },
  "impact": {
    "high": 1,
    "medium": 2,
    "low": 1
  }
}
```

A browser run has no filesystem cache or baseline, so those counters are `0`.
Browser-specific configuration diagnostics and runtime metadata remain separate
extensions rather than changing the finding shape.

## Finding contract

Every v1 finding is self-describing. It contains:

- `ruleId` and `detectorId`;
- `ruleTitle`, `ruleRationale`, and nullable `ruleUrl`;
- enforcement `severity`;
- independent `impact` and `confidence` classifications;
- nullable `contextNote` for contextual or otherwise qualified evidence;
- normalized `file`, `location`, `excerpt`, `message`, and `suggestion`;
- a stable `fingerprint`;
- normalized `fix` metadata.

`ruleTitle` and `ruleRationale` are nullable for older/built-in detector findings
that rely on canonical rulebook enrichment. Custom-rule detectors populate them,
and integrations **must preserve them**. A custom finding must not require its ID
to exist in Coding Bible's public rule catalog in order to be displayed, emitted
as SARIF, or returned over MCP.

Example:

```json
{
  "ruleId": "ACME-001",
  "detectorId": "custom-rule-acme-001-call",
  "ruleTitle": "Avoid dangerous",
  "ruleRationale": "The project forbids the dangerous helper.",
  "ruleUrl": "https://engineering.example/rules/ACME-001",
  "severity": "error",
  "impact": "high",
  "confidence": "strong",
  "contextNote": null,
  "file": "src/example.ts",
  "location": { "line": 8, "column": 1, "endLine": 8, "endColumn": 10 },
  "excerpt": "dangerous();",
  "message": "Do not call dangerous().",
  "suggestion": "Use safeAlternative().",
  "fingerprint": "0123456789abcdef01234567",
  "fix": { "available": false, "safety": "none" }
}
```

## Fingerprints

Fingerprints intentionally exclude line and column numbers. CLI and browser
reports hash the same payload: rule ID, detector ID, normalized relative file
path, normalized offending source excerpt, and message. The SHA-256 digest is
truncated to 24 hexadecimal characters. This keeps identity stable when unrelated
lines move while still changing when the finding itself materially changes.

## Fix safety

- `safe`: deterministic edit considered semantics-preserving for the evidence the
  detector has. Coding Bible applies the edit in memory and re-runs the relevant
  analysis before exporting it.
- `review`: a concrete proposed edit exists, but runtime behavior, compatibility,
  identity, allocation, or surrounding design may change. It never appears in
  `safe-fixes.patch`.
- `none`: the report still contains the human suggestion, but Coding Bible does
  not pretend it can produce a trustworthy edit.

Patch export does not modify source files. Consumers decide whether to apply a
patch, and should use `git apply --check` first. Both patch files describe the
source snapshot that was analyzed; after applying either patch, re-run Coding
Bible before applying further proposed edits.
