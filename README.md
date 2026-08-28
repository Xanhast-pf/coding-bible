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
- a CLI
- editor integrations
- PR review tooling
- framework-specific rule packs

## Workspace

```text
apps/
  web/                  Public website

packages/
  analyzer/             AST-backed source analyzer
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

`pnpm check` runs typechecking, the dependency-free Node test suites, and a
production build. TypeScript is installed at the workspace root because
multiple workspace packages use `tsc`. pnpm is also configured to allow the
`esbuild` lifecycle script required by Vite, so a fresh install does not require
a manual `pnpm approve-builds` step.

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
TypeScript parser does not increase the initial Learn-page bundle.

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
separate AST-backed package with regression tests for every supported detector,
while semantic rules remain a human-review responsibility.

A self-violation is treated as useful feedback: either the implementation is
wrong or the rule needs better scope, severity, or exceptions.

## Status

Pre-alpha. The rule library and Learn experience are established; the first
AST-backed analyzer is now the second product surface.
