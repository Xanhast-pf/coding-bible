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
```

Exit codes are stable for CI:

- `0` — no error-level findings or analyzer failures; warnings may be present
- `1` — error-level findings or malformed source
- `2` — invalid configuration, Git/tooling failure, or analyzer runtime failure

Git scopes affect which files are reported, not the TypeScript context used to
understand them. `--since` includes committed branch changes plus current local
changes; `--changed` covers the working tree and untracked files; `--staged`
checks only the index.

### Configuration

The CLI searches upward for the nearest `coding-bible.config.*` and treats that
directory as the project root. Supported extensions are `.ts`, `.mts`, `.mjs`,
`.js`, `.cjs`, and `.json`.

```ts
import { defineConfig } from "@coding-bible/analyzer";

export default defineConfig({
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
Unknown config keys and invalid settings fail with exit code `2` rather than
being silently ignored.

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

Snippet analysis builds one TypeScript program and shared
symbol/import/reference indexes. Project scans reuse real project Programs: when
a workspace has multiple tsconfigs, selected files are grouped by the nearest
config instead of being forced through an invented root compiler setup.

Disabled rules are removed before detector execution. Analysis accepts an
`AbortSignal`, allowing future editor/agent consumers to cancel stale work.
`--profile` reports configuration, discovery, Program construction, detector
runtime, total wall time, and resident memory.

Run the optional synthetic project benchmark with:

```bash
node packages/analyzer/bench/project-benchmark.mjs
CODING_BIBLE_BENCH_FILES=5000 node packages/analyzer/bench/project-benchmark.mjs
CODING_BIBLE_BENCH_MAX_MS=2500 CODING_BIBLE_BENCH_MAX_RSS_MB=512 node packages/analyzer/bench/project-benchmark.mjs
```

Every automated rule is contract-tested against the registry: its exact DON'T
example must parse and produce that rule, while its exact DO example must parse
and produce zero findings across every applicable detector. Paired
all-violations/all-clean fixtures guard the full integration path.

The package intentionally does not guess at architecture, naming quality,
business logic, or other rules that require repository or human context.
