# Coding Bible

A public, opinionated engineering guide for writing software that is easy to
understand, difficult to misuse, and pleasant to maintain.

The project is **rules-first**. The website is one consumer of the rule set.

## Core idea

Each rule is structured data with a stable ID, rationale, severity, examples,
exceptions, tags, status, and detection metadata.

That single source can eventually power:

- the public website
- full-text search
- AI context files
- the browser code analyzer
- a project-aware CLI / CI scanner
- a local MCP server for coding agents
- editor integrations
- PR review tooling
- framework-specific rule packs

## Workspace

```text
apps/
  web/                  Public website

packages/
  analyzer/             AST-backed source analyzer
  mcp/                  Read-only local MCP server
  rules/                Canonical rule schema + rule content

docs/
  adr/                  Architecture Decision Records
  principles/           Human-readable philosophy
```

## Local development

```bash
nvm use
pnpm install
pnpm check
pnpm dev
```

`pnpm check` is the authoritative repository gate. It runs ESLint, Prettier
verification, typechecking, Knip, the Node test suites, a production build, and
finally a full Coding Bible scan. TypeScript is installed at the workspace root
because multiple workspace packages use `tsc`. pnpm is also configured to allow
the `esbuild` lifecycle script required by Vite, so a fresh install does not
require a manual `pnpm approve-builds` step.

## Source distillation

Project review standards are treated as evidence, not automatically as universal
law. Rules are promoted only when their rationale survives outside the source
repository; style-only conventions remain project-specific.

See `docs/principles/source-distillation.md`.

## Framework-specific packs

Framework guidance is intentionally separated from universal rules. Current
packs include React, Legend-State, Redux, GraphQL, Apollo Client, TanStack Query,
and Next.js. Framework rules link to official documentation where available.

This separation matters: different state libraries can legitimately have
different invariants. The Bible documents the model rather than forcing one
library's assumptions onto another.

## Agent interface

Coding Bible publishes static, generated machine-facing resources from the same
canonical rule registry used by the website and analyzer:

```text
/coding-bible/llms.txt
/coding-bible/llms-full.txt
/coding-bible/rules.json
/coding-bible/rules.schema.json
/coding-bible/agents/all.txt
/coding-bible/agents/<pack>.txt
```

`rules.json` is a versioned public contract. Backward-incompatible schema changes
require a `formatVersion` bump. The generated files are committed for GitHub
Pages but must not be edited manually:

```bash
pnpm agent:generate
pnpm agent:check
```

The Learn view's `tldr;` action remains the interactive filtered export for any
current search/pack/level combination, while the generated `agents/<pack>.txt`
files provide stable pack-level prompts for external tooling.

## MCP server

Coding Bible also exposes a local stdio MCP server for coding agents:

```bash
pnpm mcp --root /absolute/path/to/project
```

It provides four read-only tools:

- `check_code` — deterministic analysis for an in-memory JS/TS snippet.
- `check_files` — project-aware CLI analysis for files/directories under the
  configured root. MCP scans force `--no-cache` so tool calls do not write the
  analyzer cache.
- `get_rule` — canonical rule data and the corresponding agent prompt.
- `get_project_guidance` — stable foundation/quality rules plus ecosystem packs
  detected from local package manifests.

`check_code` and `check_files` report only deterministic analyzer coverage; a
clean result is not a claim that semantic rules were reviewed. The configured
root is a path boundary for tool inputs, not an operating-system sandbox. See
`packages/mcp/README.md` and ADR-011 for the server contract.

## GitHub Pages

The production site is configured for:

```text
https://xanhast-pf.github.io/coding-bible/
```

Pushes to `main` are deployed by `.github/workflows/deploy-pages.yml`.

In the GitHub repository, set **Settings → Pages → Source** to **GitHub Actions**.

Search can be focused with `⌘/Ctrl+K`. Search and filters are reflected in the URL so useful rule views can be bookmarked or shared.

The **Analyze** mode accepts TypeScript, TSX, JavaScript, and JSX snippets and
runs supported checks locally in the browser. The analyzer is lazy-loaded so the
TypeScript parser does not increase the initial Learn-page bundle. The same
engine powers a tsconfig-aware project scanner:

```bash
coding-bible check src
coding-bible check . --changed
coding-bible check . --staged
coding-bible check . --since origin/main
```

Projects can add `coding-bible.config.ts` to choose include/ignore patterns,
enable or disable automated packs/rules, set error versus warning severity, and
apply file-specific overrides. Git-aware scopes report only requested changes
while retaining project context for analysis. Project-result caching is enabled by
default under the ignored `.coding-bible/cache/` directory; unchanged projects
can reuse validated file results without rebuilding a TypeScript Program. Use
`--no-cache` for a cold run or `--clear-cache` to reset it. `--profile` exposes
cache hit/miss counts alongside scanner phase timings and memory use.

Existing projects can adopt Coding Bible without fixing all historical debt in
one commit:

```bash
coding-bible baseline create .
coding-bible check .
coding-bible check . --no-baseline
```

The committable `.coding-bible-baseline.json` stores stable finding fingerprints.
Known findings are suppressed, while changed/new violations and syntax errors
still surface normally. Baselines are intentionally separate from the disposable
cache.

Analyzer results can also be exported without modifying source files:

```bash
coding-bible check . --report
coding-bible check . --report --patch
coding-bible check . --report --patch --include-review-fixes
```

The default `.coding-bible/` output contains a versioned `report.json` plus a
standard Git `safe-fixes.patch` when requested. Behavior-sensitive proposed
edits are isolated in `review-fixes.patch` behind the explicit
`--include-review-fixes` flag. Safe fixes are re-analyzed before export and can
be reviewed with `git apply --check` before anything touches the working tree.

## Git quality gates

Husky installs repository hooks during `pnpm install`. Pre-commit deliberately
keeps auto-fixing separate from verification:

```text
ESLint --fix + Prettier on staged files
  -> affected workspace tests
  -> typecheck
  -> Knip dependency check
  -> Coding Bible --staged
```

`lint-staged` protects partially staged files while applying ESLint and Prettier
fixes and re-stages only those fixes. Coding Bible runs last so its findings are
not mixed with formatting or basic lint noise.

Affected tests are selected at workspace granularity: changes in a shared
package run that package plus downstream web tests; documentation-only commits
do not pay for unrelated tests. If that step becomes disruptive during an
iterative commit, bypass only it rather than disabling the whole hook:

```bash
SKIP_AFFECTED_TESTS=1 git commit -m "wip"
```

Targeted escape hatches also exist for exceptional local work:

```text
SKIP_TYPECHECK=1
SKIP_AGENT_INTERFACE=1
SKIP_KNIP=1
SKIP_BIBLE=1
```

They are intentionally opt-in. Pre-push and CI still run the complete `pnpm
check` gate: full lint, formatting verification, typecheck, Knip, all tests,
production build, and finally the full Coding Bible project scan.

Each rule also exposes a `tldr;` action that copies an AI-optimized prompt with
the rule rationale, examples, exceptions, and canonical deep link. The rule-list
`tldr;` action exports the currently visible rule set, so the same control works
for a filtered section or the whole Bible.

Rule deep links use fragments such as:

```text
https://xanhast-pf.github.io/coding-bible/#TS-001
```

This keeps deep links reliable on static GitHub Pages without a routing
dependency.

## Dogfooding

The Coding Bible follows its own applicable `stable` rules.

The rule registry validates itself at runtime without an additional dependency,
and pure behavior is covered with Node's built-in test runner. The analyzer is a
separate AST-backed, symbol-aware package with regression tests, paired clean /
violation fixtures, syntax diagnostics, rule-example contracts, config/scoping
tests, multi-tsconfig project context, cancellation, and profiling. Semantic
rules remain a human-review responsibility.

A self-violation is treated as useful feedback: either the implementation is
wrong or the rule needs better scope, severity, or exceptions.

## Status

Pre-alpha. The rule library and Learn experience are established; the analyzer now supports both browser snippets and configurable project-scale CLI scans.
