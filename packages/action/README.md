# Coding Bible GitHub Action

The repository root exposes Coding Bible as a self-contained JavaScript action.
Consumers pin a release tag, floating minor branch, or immutable commit and do
not install Coding Bible, pnpm, or TypeScript in their workflow.

## Minimal pull-request review

```yaml
name: Coding Bible

on:
  pull_request:

permissions:
  contents: read

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0

      - uses: Xanhast-pf/coding-bible@v0.27.0
```

`changed` is the default scope. The action resolves the pull-request base SHA,
analyzes current files with full project/tsconfig context, then reports only
findings whose locations overlap added or modified lines. This avoids turning a
small PR into a report of unrelated historical debt.

Use `scope: project` when a full scan is desired:

```yaml
- uses: Xanhast-pf/coding-bible@v0.27.0
  with:
    scope: project
    path: src
    fail-on: warning
```

## Inputs

| Input | Default | Purpose |
| --- | --- | --- |
| `scope` | `changed` | `changed` or `project` |
| `path` | `.` | Repository-relative analysis boundary |
| `base-ref` | auto | Explicit Git comparison base for changed scope |
| `fail-on` | `error` | `error`, `warning`, or `none` |
| `config` | auto | Optional Coding Bible config path |
| `rules` | all | Optional comma/space-separated automated-rule allowlist |
| `exclude-rules` | none | Optional comma/space-separated automated rules to skip |
| `baseline` | `true` | Honor an existing Coding Bible baseline |
| `annotations` | `true` | Emit GitHub error/warning annotations |
| `sarif` | `true` | Write `.coding-bible/coding-bible.sarif` |

Rule selection is an extra filter on top of the repository config. For example:

```yaml
- uses: Xanhast-pf/coding-bible@v0.27.0
  with:
    rules: TS-001, REACT-006, LEGEND-001
    exclude-rules: REACT-006
```

The allowlist is applied first and exclusions win afterward. Unknown or
non-automated IDs fail the Action instead of being ignored. Omit both inputs to
run every automated rule enabled by repository config. Coding Bible's own
dogfood workflow intentionally omits both, and the canary workflow should do the
same so those repositories always exercise the complete applicable catalog.

The action also writes a GitHub Step Summary and exposes counts through outputs.
The committed runtime caps log annotations at 50; complete results remain
available in the summary/SARIF output.

For install-free consumers, prefer `coding-bible.config.json` or an import-free
ES module that directly exports the config object. A config that imports
`@coding-bible/analyzer` still requires that package to be resolvable in the
consumer repository; the Action does not mutate or bootstrap `node_modules`.

## Optional Code Scanning upload

SARIF generation is local and requires no GitHub token permission. Uploading it
to GitHub Code Scanning is deliberately a separate step because availability
and permissions differ between public and private repositories.

```yaml
permissions:
  contents: read
  security-events: write

steps:
  - uses: actions/checkout@v7
    with:
      fetch-depth: 0

  - id: coding-bible
    uses: Xanhast-pf/coding-bible@v0.27.0
    with:
      fail-on: none

  - if: always() && steps.coding-bible.outputs.sarif-path != ''
    uses: github/codeql-action/upload-sarif@v4
    with:
      sarif_file: ${{ steps.coding-bible.outputs.sarif-path }}
      category: coding-bible
```

If the Coding Bible step should gate the PR, leave `fail-on: error` (the
default). A SARIF-upload workflow can use `fail-on: none` when Code Scanning is
the only desired reporting surface.

## Version pinning

Release tags are the public action contract:

- `@v0.27.0` pins the exact Coding Bible release tag.
- `@v0.27` is the floating minor branch for compatible patch updates.
- a full commit SHA gives consumers an immutable supply-chain pin.

The repository commits `packages/action/dist`. `pnpm action:build` regenerates
that self-contained runtime from the analyzer and generated canonical rule
catalog; `pnpm action:check` rejects source/runtime drift.

The runtime vendors the exact TypeScript compiler used during generation so a
consumer does not need a package-install step. It remains read-only: source
files are analyzed but never rewritten.
