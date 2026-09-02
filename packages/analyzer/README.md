# @coding-bible/analyzer

Deterministic automation for the subset of Coding Bible rules that static
analysis can defend with useful confidence.

The analyzer is one consumer of the canonical rule system, not a replacement for
ESLint, Prettier, TypeScript, compilers, tests, or semantic code review. The
browser API accepts source strings; the CLI adds filesystem, Git, configuration,
and tsconfig-aware project context around the same detector engine.

A clean result means clean for the applicable automated subset only. Rules that
require architecture, runtime intent, or broader repository judgment remain
explicitly human- or agent-reviewed.

```ts
import { analyze } from "@coding-bible/analyzer";

const result = analyze({
  language: "tsx",
  source,
});
```

## Project scanner

```bash
coding-bible check src
coding-bible check . --changed
coding-bible check . --staged
coding-bible check . --since origin/main
coding-bible check . --json
coding-bible check . --profile
coding-bible check . --rules TS-001,REACT-006
coding-bible check . --exclude-rules JS-004
coding-bible check . --no-cache
coding-bible baseline create .
coding-bible check . --no-baseline
coding-bible check . --report --patch
coding-bible check . --report --patch --include-review-fixes
```

Exit codes are stable for CI:

- `0` — no error-level findings or analyzer failures; warnings may be present
- `1` — error-level findings or malformed source
- `2` — invalid configuration, Git/tooling failure, or analyzer runtime failure

Git scopes affect which files are reported, not the TypeScript context used to
understand them. `--since` includes committed branch changes plus current local
changes; `--changed` covers the working tree and untracked files; `--staged`
checks only the index.

### Cache and baselines

Incremental caching is enabled by default at `.coding-bible/cache/`. Every
detector declares whether it depends only on the current source file or on the
whole TypeScript project. Source-file detector results are fingerprinted
independently, so editing one file can reuse validated findings for unaffected
files and analyze only cache misses in a small TypeScript Program. Project-scope
detectors remain tied to the complete project signature. Compiler options,
Coding Bible config, rule selection, dependency metadata, TypeScript version,
and analyzer implementation changes invalidate the relevant entries.
Project-reference graphs remain deliberately cache-conservative.

```bash
coding-bible check . --profile
coding-bible check . --no-cache
coding-bible check . --clear-cache
```

`--profile` reports cache hashing time plus file hit/miss counts. A full-project
scan still validates selected source contents rather than trusting mtimes, while
changed/staged/targeted scopes hash only their selected files when no project-
scope detector requires the full graph. Cache data is disposable and belongs
under the ignored `.coding-bible/` directory. Set `cache: false` or a custom
cache directory in config when needed.

Baselines solve a different problem: adopting Coding Bible in a repository that
already contains known violations. Create one with:

```bash
coding-bible baseline create .
```

The default `.coding-bible-baseline.json` is intended to be committed. Ordinary
checks suppress findings with matching stable fingerprints; line movement does
not invalidate an entry, while changing the offending code does. Syntax errors
are never suppressed. Use `--no-baseline` to audit the full current debt or
`--baseline-file <path>` to override the configured path. Set `baseline: false`
to disable automatic baseline loading.

### Reports and proposed fixes

`--json` emits the versioned report schema. `--report` writes the same payload to
`.coding-bible/report.json`. Findings include a canonical rule URL and a stable
fingerprint derived from the rule, detector, file, normalized offending source,
and message rather than a fragile line number.

```bash
coding-bible check . --report
coding-bible check . --report --patch
coding-bible check . --report --patch --include-review-fixes
```

Patch export never edits source files. `safe-fixes.patch` contains only
deterministic edits that Coding Bible re-analyzes in memory before export.
`review-fixes.patch` is deliberately separate because those edits can change
behavior, runtime compatibility, allocation, or identity semantics. Both files
are standard unified Git patches:

```bash
git apply --check .coding-bible/safe-fixes.patch
git apply .coding-bible/safe-fixes.patch
```

The first safe fixes are intentionally narrow: type-only import markers and the
namespaced `Number.parseInt` / `Number.parseFloat` equivalents. Coercion-sensitive
`isNaN` / `isFinite` changes and non-mutating `toSorted` / `toReversed` changes
are review-only. Findings without a defensible mechanical edit still carry their
human suggestion but produce no patch change. Use `--output-dir <path>` to move
all generated artifacts together.

### Configuration

The CLI searches upward for the nearest `coding-bible.config.*` and treats that
directory as the project root. Supported extensions are `.ts`, `.mts`, `.mjs`,
`.js`, `.cjs`, and `.json`.

```ts
import { defineConfig } from "@coding-bible/analyzer";

export default defineConfig({
  // Disposable warm-scan results. Use false to disable.
  cache: ".coding-bible/cache",

  // Committable known-debt fingerprint file. Use false to disable.
  baseline: ".coding-bible-baseline.json",

  include: ["src/**/*"],

  // Set ignoreDefaults: false only if you intentionally want to scan build,
  // dependency, declaration, generated, vendor, or minified-code locations.
  ignoreDefaults: true,
  ignore: [
    "src/legacy/**",
    "**/*.fixtures.ts",
  ],

  packs: {
    core: "error",
    typescript: "error",
    react: "warning",
  },

  rules: {
    "REACT-006": "error",
    "JS-004": "off",
  },

  overrides: [
    {
      files: ["**/*.test.{ts,tsx}"],
      rules: {
        "TS-001": "warning",
      },
    },
  ],
});
```

Individual rule settings override pack settings. A one-off scan can additionally
narrow the automated catalog without editing config:

```bash
coding-bible check . --rules TS-001,REACT-006
coding-bible check . --exclude-rules JS-004,REACT-008
```

`--rules` is an allowlist; `--exclude-rules` is applied afterward, and both
accept comma-separated rule IDs. Omitting both always means every automated rule
that is enabled by project config. Unknown or non-automated IDs fail instead of
being silently ignored.

File overrides are applied in order after the project-wide settings. Default
ignores cover dependencies, build output, coverage, declarations, common
generated/vendor directories, browser static assets, and minified source files.
Set `ignoreDefaults: false` to opt out explicitly.
Unknown config keys, unknown/non-automated rule IDs, and invalid settings fail
with exit code `2` rather than being silently ignored.

Use `coding-bible config` or `coding-bible config --json` to inspect the resolved
configuration. Set `tsconfig: false` to disable tsconfig discovery, or provide a
path to force one config. Otherwise selected files are grouped by their nearest
`tsconfig.json`, which keeps workspace packages on their own compiler settings.

### Declarative custom rules

Organization-specific policy can be declared directly in
`coding-bible.config.json` or an executable config module. Declarative rules are
data, not arbitrary browser-executed code, so the same definition can travel
through browser Project mode, CLI scans, and the self-contained GitHub Action.

```ts
export default {
  customRules: [
    {
      id: "ACME-001",
      title: "Use the organization analytics wrapper",
      rationale:
        "The wrapper centralizes consent, event naming, and transport behavior.",
      confidence: "certain",
      impact: "high",
      match: {
        kind: "import",
        source: "@vendor/raw-analytics",
      },
      message: "Do not import the raw analytics client.",
      suggestion: "Import @acme/analytics instead.",
      url: "https://engineering.example.com/standards/ACME-001",
    },
    {
      id: "ACME-002",
      title: "Use the shared HTTP client",
      rationale:
        "The shared client owns authentication, retries, and observability.",
      confidence: "strong",
      contextNote:
        "Approved platform adapters can be excluded with file-specific overrides.",
      impact: "medium",
      match: {
        kind: "call",
        callee: "fetch",
      },
      message: "Direct fetch calls bypass the organization HTTP boundary.",
      suggestion: "Use the shared HTTP client.",
    },
  ],
  rules: {
    "ACME-002": "warning",
  },
};
```

Custom rule IDs use the same `PREFIX-000` shape as core rules. The first
declarative matcher set is intentionally narrow and AST-backed:

- `{ kind: "import", source, mode?: "exact" | "prefix" }` checks static imports
  and re-exports.
- `{ kind: "call", callee }` checks a literal call expression such as `fetch`
  or `window.fetch`.

This DSL should grow only where matching semantics remain explainable and
portable. Complex organization-specific semantic analysis belongs in a full
detector maintained by a fork/contributor until a stable plugin contract exists.

### Adding a full detector

Official contributors and forks should not edit generated registries manually.
Scaffold the canonical rule and detector together:

```bash
pnpm rule:new -- --id REACT-014 --title "Prefer explicit event ownership" --detector
```

The detector stub owns an inline `profile` with impact/confidence/context
metadata. Existing built-ins remain compatible with the legacy profile registry,
so this authoring improvement does not require a mass migration. Detector modules
are discovered for every rule pack and wired by `pnpm registries:generate`.

Library consumers building their own analyzer wrapper can also pass
`additionalDetectors` to `analyze`, `analyzeMany`, or `analyzeProgram`.
Additional detectors must use unique detector IDs and declare an inline profile.

## Automated coverage

The current pass runs 24 detector functions covering 23 Bible rules:

JSX-aware React, accessibility, and Legend-State detectors also run on legacy `.js` sources because many established React codebases use JSX without the `.jsx` extension.

- `CORE-003` bindings that can be `const`
- `JS-001` clearly redundant `async` functions without asynchronous or Promise-returning semantics
- `JS-002` repeated nullish guard chains suited to optional chaining
- `JS-003` body-level undefined defaults suited to default parameters
- `JS-004` legacy global/prototype built-ins
- `JS-006` mutating sort/reverse results stored as separate values
- `TS-001` explicit `any`
- `TS-003` value imports used only in type positions
- `TS-004` unsafe assertions over external runtime data, including local aliases
- `TS-007` direct assertions from `unknown`, including double-assertion escape hatches
- `A11Y-001` clickable generic elements without native semantics
- `A11Y-002` custom buttons without equivalent keyboard handling
- `A11Y-004` buttons without a detectable accessible name
- `GQL-002` runtime interpolation inside `gql`/`graphql` templates
- `I18N-001` hardcoded user-visible JSX text in files that already import a supported localization API
- `LEGEND-001` Legend-State `get()` subscriptions inside `observer` renders
- `REACT-004` state that is only synchronized from Effect dependencies
- `REACT-006` missing list keys
- `REACT-006` unstable index/generated list keys
- `REACT-008` context-free array/object allocations inside components
- `REACT-009` invalid Hook placement
- `REACT-010` direct invocation of local React components
- `REACT-011` mutation of values received through component inputs
- `REACT-012` exhaustive-deps suppressions

`AnalyzeResult.ruleIdsChecked` reports the exact automated rule set applicable to
the language and active configuration. A clean result means "clean for the
applicable automated subset," never "all Coding Bible rules were reviewed."
Malformed source is reported through diagnostics and rule checks pause for that
file.

## Analysis model

Snippet analysis builds one TypeScript program and a shared syntax index. Symbol
and reference resolution is lazy, so detectors only pay TypeScript checker cost
for identifiers they actually inspect. Project scans reuse real project
Programs: when a workspace has multiple tsconfigs, selected files are grouped by
the nearest
config instead of being forced through an invented root compiler setup.

Disabled rules are removed before detector execution. Analysis accepts an
`AbortSignal`, allowing future editor/agent consumers to cancel stale work.
Warm project scans can reuse validated per-file results and skip TypeScript
Program construction entirely when the full project signature is unchanged.
`--profile` reports configuration, discovery, cache hashing/hits, Program
construction, detector runtime, total wall time, and resident memory.

Run the optional synthetic project benchmark with:

```bash
pnpm bible:bench
CODING_BIBLE_BENCH_FILES=5000 pnpm bible:bench
CODING_BIBLE_BENCH_MAX_MS=2500 CODING_BIBLE_BENCH_MAX_WARM_MS=500 CODING_BIBLE_BENCH_MAX_RSS_MB=512 pnpm bible:bench
```

Every automated rule is contract-tested against the registry: its exact DON'T
example must parse and produce that rule, while its exact DO example must parse
and produce zero findings across every applicable detector. Paired
all-violations/all-clean fixtures guard the full integration path.

The package intentionally does not guess at architecture, naming quality,
business logic, or other rules that require repository or human context.

## Detector ownership

Automated checks are organized one Bible rule per prefixed module, mirroring the
rule catalog. For example, `REACT-009` lives in
`src/detectors/react/REACT-009-hook-placement.ts`. A rule with several detector
strategies exports them together through its `<ruleIdWithoutDash>Detectors`
array. The detector wiring in `src/detectors/registry.generated.ts` is generated by
`scripts/rules/generate-registries.mjs`; do not register detectors by hand.
`src/detectors/index.ts` is intentionally kept as a stable public/runtime entry point.

### Finding impact and confidence

Every analyzer finding carries metadata separate from configured enforcement severity:

- `impact`: `high`, `medium`, or `low`.
- `confidence`: `certain`, `strong`, or `contextual`.
- `contextNote`: present when surrounding code/runtime intent can materially change the conclusion.

`error`/`warning` remains the configurable CI policy. Impact describes likely consequence; confidence describes how strongly static analysis supports the conclusion. Contextual findings are intentionally surfaced with a disclaimer rather than presented as proven bugs.
