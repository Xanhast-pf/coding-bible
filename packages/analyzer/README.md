# @coding-bible/analyzer

Deterministic Coding Bible checks for pasted source and real TypeScript projects.

The analyzer remains UI-free. The browser API accepts source strings; the CLI
adds filesystem, Git, configuration, and tsconfig-aware project context around
the same detector engine.

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

Project-result caching is enabled by default at `.coding-bible/cache/`. A cached
result is reused only when the complete tsconfig project source set, compiler
options, Coding Bible config, dependency metadata, TypeScript version, and
analyzer implementation signature are unchanged. Project-reference graphs are
currently analyzed normally instead of cached. This deliberately favors a cold
rebuild over a questionable cache hit.

```bash
coding-bible check . --profile
coding-bible check . --no-cache
coding-bible check . --clear-cache
```

`--profile` reports cache hashing time plus file hit/miss counts. Cache data is
disposable and belongs under the ignored `.coding-bible/` directory. Set
`cache: false` or a custom cache directory in config when needed.

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
  // dependency, declaration, or generated-code locations.
  ignoreDefaults: true,
  ignore: [
    "src/vendor/**",
    "**/*.generated.ts",
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

Individual rule settings override pack settings. File overrides are applied in
order after the project-wide settings. Default ignores cover dependencies, build output, coverage, declarations, and
common generated-code paths. Set `ignoreDefaults: false` to opt out explicitly.
Unknown config keys, unknown/non-automated rule IDs, and invalid settings fail
with exit code `2` rather than being silently ignored.

Use `coding-bible config` or `coding-bible config --json` to inspect the resolved
configuration. Set `tsconfig: false` to disable tsconfig discovery, or provide a
path to force one config. Otherwise selected files are grouped by their nearest
`tsconfig.json`, which keeps workspace packages on their own compiler settings.

## Automated coverage

The current pass runs 20 detector functions covering 19 Bible rules:

- `CORE-003` bindings that can be `const`
- `JS-002` repeated nullish guard chains suited to optional chaining
- `JS-003` body-level undefined defaults suited to default parameters
- `JS-004` legacy global/prototype built-ins
- `JS-006` mutating sort/reverse results stored as separate values
- `TS-001` explicit `any`
- `TS-003` value imports used only in type positions
- `TS-004` unsafe assertions over external runtime data, including local aliases
- `A11Y-001` clickable generic elements without native semantics
- `A11Y-002` custom buttons without equivalent keyboard handling
- `A11Y-004` buttons without a detectable accessible name
- `GQL-002` runtime interpolation inside `gql`/`graphql` templates
- `LEGEND-001` Legend-State `get()` subscriptions inside `observer` renders
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
