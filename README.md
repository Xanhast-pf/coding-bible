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
- a paste-in code reviewer
- a CLI
- editor integrations
- PR review tooling
- framework-specific rule packs

## Workspace

```text
apps/
  web/                  Public website

packages/
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

Rule deep links use fragments such as:

```text
https://xanhast-pf.github.io/coding-bible/#TS-001
```

This keeps deep links reliable on static GitHub Pages without a routing
dependency.

## Dogfooding

The Coding Bible follows its own applicable `stable` rules.

The rule registry validates itself at runtime without an additional dependency,
and pure behavior is covered with Node's built-in test runner. A deterministic
analyzer will become a workspace package only when there is executable analyzer
behavior to ship.

A self-violation is treated as useful feedback: either the implementation is
wrong or the rule needs better scope, severity, or exceptions.

## Status

Foundation / pre-alpha. Rule quality and architecture come before visual polish.
