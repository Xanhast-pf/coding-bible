# Analyzer report schema v1

Coding Bible keeps the analyzer report separate from proposed source changes.
The report is JSON; proposed edits are standard Git unified patches.

## Files

```text
.coding-bible/
  report.json
  safe-fixes.patch
  review-fixes.patch
```

`review-fixes.patch` is created only when `--include-review-fixes` is requested.
Generated artifacts are ignored by Coding Bible discovery and by this repository.

## Report shape

```json
{
  "schemaVersion": 1,
  "scope": { "mode": "changed" },
  "summary": {
    "filesDiscovered": 84,
    "filesAnalyzed": 7,
    "rulesChecked": 19,
    "findings": 4,
    "errors": 2,
    "warnings": 2,
    "safeFixes": 1,
    "reviewFixes": 1,
    "diagnostics": 0
  },
  "project": {
    "configPath": "coding-bible.config.ts",
    "projectCount": 1,
    "tsconfigPaths": ["tsconfig.json"]
  },
  "diagnostics": [],
  "findings": [],
  "profile": null
}
```

Each finding contains its detector and rule IDs, severity, normalized file path,
source location, excerpt, message, suggestion, canonical rule URL, stable
fingerprint, and fix metadata.

## Fingerprints

Fingerprints intentionally exclude line and column numbers. They hash the rule,
detector, normalized relative file path, normalized offending source excerpt, and
message. This keeps identity stable when unrelated lines move while still
changing when the finding itself materially changes.

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
