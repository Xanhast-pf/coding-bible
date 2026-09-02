# Coding Bible

**A shared engineering standard for humans and AI agents.**

Structured rules. Defensible automated review. Focused context for code review
and remediation.

Coding Bible codifies maintainable software practices as structured, explainable
rules. It automates only the subset static analysis can defend with useful
confidence, then makes the same guidance available to humans, CI, and coding
agents.

It does **not** replace ESLint, Prettier, TypeScript, compilers, tests, or code
review. Those tools answer questions about formatting, syntax, types,
buildability, or behavior. Coding Bible asks a different question:

> Does this code follow the engineering standards we want humans and AI agents
> to apply consistently?

The project is **rules-first**. The website, analyzer, CLI, GitHub Action, MCP
server, and future integrations are consumers of the same canonical rule set.

## Where Coding Bible fits

| Tool | Primary responsibility |
| --- | --- |
| Prettier | Formatting |
| ESLint | General-purpose linting and ecosystem diagnostics |
| TypeScript | Type correctness |
| Compiler / build tools | Transformation and executable output |
| Tests | Behavioral expectations |
| **Coding Bible** | **Explainable engineering standards, defensible automated review, and focused remediation context** |
| Human / AI reviewer | Architecture, intent, tradeoffs, and remediation |

Coding Bible does not collect diagnostics just because they can be detected. It
codifies engineering judgment, automates only what can be defended, and leaves
the rest explicit for human or agent review.

See `docs/principles/tooling-boundaries.md`.

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
- GitHub Actions / PR review tooling
- framework-specific rule packs

## Workspace

```text
apps/
  web/                  Public website

packages/
  action/               Self-contained GitHub Action runtime
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

`pnpm check` is the developer-facing full repository gate. It intentionally
self-heals deterministic maintenance first: regenerate committed artifacts, apply
ESLint fixes, and run Prettier across the resulting tree. It then switches to
read-only verification: generated-artifact drift, formatting, lint, typechecking,
Knip, tests, package builds, and finally the full Coding Bible dogfood scan.

`pnpm check:ci` runs only that strict verification phase. CI and pre-push use it
so a runner or Git hook can never make an uncommitted fix and then report success
for a commit that does not contain the fix.

In short:

```text
pnpm check
  generate
  -> ESLint --fix
  -> Prettier --write
  -> strict verification

pnpm check:ci
  generated-artifact checks
  -> Prettier check
  -> ESLint
  -> typecheck
  -> Knip
  -> tests
  -> package builds
  -> Coding Bible
```

TypeScript is installed at the workspace root because multiple workspace packages
use `tsc`. pnpm is also configured to allow the `esbuild` lifecycle script
required by Vite, so a fresh install does not require a manual
`pnpm approve-builds` step.

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

## Extensible by design

Coding Bible is opinionated by default, not closed by design. The public Bible
contains broadly reusable engineering standards, while teams can layer their own
organization-specific policy on top without rewriting the analyzer.

Portable declarative custom rules can live inline in `coding-bible.config.*` or
in versioned local JSON rulebooks referenced through `customRuleFiles`. Both
forms run through the same analyzer path in the browser, CLI, and GitHub Action.
They are intended for defensible local policies such as restricted imports and
required abstraction boundaries. Custom findings keep their own title, rationale,
confidence, impact, and optional documentation URL so reports and future agent
handoffs remain self-describing.

Contributors and forks can add full AST/project-aware detectors without hand-
editing registries:

```bash
pnpm rule:new -- --id APOLLO-004 --title "Prefer typed cache policies" --detector
pnpm registries:generate
pnpm check
```

When a developer wants an AI coding agent to help author the rule or detector,
Coding Bible can generate a focused, vendor-neutral implementation brief from the
current checkout:

```bash
pnpm rule:prompt -- \
  --id ACME-004 \
  --title "Use the shared HTTP client" \
  --goal "Application code must not call fetch directly outside the approved HTTP boundary."
```

Use `--mode declarative` or `--mode detector` when the implementation path is
already known; the default `auto` mode instructs the agent to choose the smallest
defensible implementation after inspecting the current analyzer contracts.

For organization policy, the authoring loop is also scaffolded and editor-friendly:

```bash
pnpm rulebook:new -- \
  --name acme-frontend \
  --id ACME-001 \
  --title "Use the organization analytics wrapper" \
  --kind import \
  --target @vendor/raw-analytics

pnpm rulebook:validate -- config/coding-bible/acme-frontend.json
```

Generated rulebooks include the published JSON Schema for autocomplete and inline
editor validation. Runtime validation remains authoritative, and the schema itself
is generated/checked as part of the repository quality gate.

The scaffolder creates the canonical rule plus an analyzer module with an inline
finding profile; generated registries discover detector modules for every rule
pack. See `docs/principles/extensible-rules.md` and the analyzer README for the
custom-rule schema and contribution contract.

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

## GitHub Action

Coding Bible can run directly in another repository from a release tag. The
consumer does not install Coding Bible, pnpm, or TypeScript:

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

The default `changed` scope analyzes current files with project/tsconfig context
but reports only findings on added or modified lines. GitHub annotations and a
Step Summary are always available without extra permissions. The action also
writes `.coding-bible/coding-bible.sarif` for optional Code Scanning upload.
Baselines and `coding-bible.config.*` remain analyzer contracts rather than
Action-specific rule definitions.

The release contains a committed self-contained Node 24 runtime under
`packages/action/dist`. Keep it synchronized with:

```bash
pnpm action:build
pnpm action:check
```

See `packages/action/README.md` and ADR-013 for inputs, outputs, SARIF upload,
and version-pinning guidance.

## MCP server

Coding Bible also exposes a local stdio MCP server for coding agents. Generate
a ready-to-paste host configuration with:

```bash
pnpm mcp --root /absolute/path/to/project --print-config cursor
pnpm mcp --root /absolute/path/to/project --print-config vscode
pnpm mcp --root /absolute/path/to/project --print-config claude-code
```

It provides six read-only tools:

- `check_code` — deterministic analysis for an in-memory JS/TS snippet.
- `check_files` — project-aware analysis for files/directories under the
  configured root. MCP scans force `--no-cache` so tool calls do not write the
  analyzer cache.
- `review_diff` — project-aware analysis filtered to added/modified lines in a
  supplied Git diff.
- `search_rules` — ranked rule discovery by concept, ID, title, tags, or pack.
- `get_rule` — canonical rule data and the corresponding agent prompt.
- `get_project_guidance` — stable foundation/quality rules plus ecosystem packs
  detected from local package manifests.

Analyzer-backed tools report only deterministic coverage; a clean result is not
a claim that semantic rules were reviewed. The configured root is a path
boundary for tool inputs, not an operating-system sandbox. See
`packages/mcp/README.md`, ADR-011, and ADR-012 for the server contract and
adoption workflow.

## GitHub Pages

The production site is configured for:

```text
https://xanhast-pf.github.io/coding-bible/
```

Pushes to `main` are deployed by `.github/workflows/deploy-pages.yml`.

In the GitHub repository, set **Settings → Pages → Source** to **GitHub Actions**.

Search can be focused with `⌘/Ctrl+K`. Search and filters are reflected in the URL so useful rule views can be bookmarked or shared.

The **Analyze** mode runs the same deterministic detector engine locally in a
Web Worker. Snippet mode builds a one-file virtual TypeScript project with real
standard libraries; Project mode can read a local folder, group files by their
nearest `tsconfig.json`, honor compiler options, resolve cross-file symbols, and
apply `coding-bible.config.json` include/ignore, pack/rule, severity, override,
and `tsconfig` settings without uploading source. Analyze also has a local rule
selector that can search, enable, disable, and toggle packs; the selection is
persisted only in that browser via `localStorage` and acts as an additional
filter on project config. Executable
`coding-bible.config.*` modules are detected but never executed from a selected
folder; use the CLI or GitHub Action when those configs are required. Completed
browser runs can export a local JSON report plus separate `safe-fixes.patch` and
`review-fixes.patch` files when detectors provide structured edits. Patch
generation uses the same shared edit/diff implementation as the CLI; review
patches are intentionally separated because they can require an intent decision.
Individual fixes can also be previewed as unified diffs in the results panel.
Analyzer findings additionally feed a GitHub-style code-review workspace: files
with findings are selectable from a side navigator, each finding centers and
highlights the exact affected range in the source pane, and an analyzer-guidance
pane explains the issue, recommended fix, and canonical rule rationale/pattern.
This avoids presenting unchanged code as a fake green replacement when a
detector intentionally requires human judgment. Snippet mode can apply
detector-authored safe fixes directly from either review surface and immediately
re-analyze the updated source; review fixes and Project mode remain read-only
and export-only. Project folder selection has no artificial file/byte rejection:
large workspaces remain analyzable with an explicit browser resource warning,
bounded-concurrency file reads, progress, and cancellation. The practical upper
bound is therefore the browser/OS memory available to the tab rather than a
Coding Bible file-count cap.
The compiler remains lazy-loaded so the initial Learn-page bundle does not pay
that cost. Installed `node_modules` are intentionally not fetched by the browser,
so the CLI remains the highest-fidelity option when dependency declarations are
required. The same engine powers the tsconfig-aware project scanner:

```bash
coding-bible check src
coding-bible check . --changed
coding-bible check . --staged
coding-bible check . --since origin/main
```

Projects can add `coding-bible.config.ts` to choose include/ignore patterns,
enable or disable automated packs/rules, set error versus warning severity, and
apply file-specific overrides. One-off CLI scans can additionally use `--rules`
or `--exclude-rules`, and the GitHub Action exposes equivalent `rules` /
`exclude-rules` inputs. Omitting those selectors means all rules enabled by
project config; Coding Bible dogfood intentionally uses that full-catalog
default. Git-aware scopes report only requested changes while retaining project
context for analysis. Incremental caching is enabled by default under the ignored
`.coding-bible/cache/` directory. Source-file detector results use independent
content fingerprints, so an edit can reuse unaffected findings and build a tiny
Program for only cache misses; project-sensitive detectors remain tied to a full
project signature. Use
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

They are intentionally opt-in. Pre-push and CI run `pnpm check:ci`, the strict
non-healing gate. Local `pnpm check` runs generation and mechanical fixes first,
then executes that same verification sequence.

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

Pre-alpha. The rule library and Learn experience are established; the analyzer now supports project-aware browser analysis, configurable CLI scans, MCP tooling, and a versioned GitHub Action.
