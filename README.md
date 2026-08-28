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
  analyzer/             Future deterministic / AST analysis engine

docs/
  adr/                  Architecture Decision Records
  principles/           Human-readable philosophy
```

## Local development

```bash
nvm use
pnpm install
pnpm dev
```

## GitHub Pages

The production site is configured for:

```text
https://xanhast-pf.github.io/coding-bible/
```

Pushes to `main` are deployed by `.github/workflows/deploy-pages.yml`.

In the GitHub repository, set **Settings → Pages → Source** to **GitHub Actions**.

Rule deep links use fragments such as:

```text
https://xanhast-pf.github.io/coding-bible/#TS-001
```

This keeps deep links reliable on static GitHub Pages without a routing
dependency.

## Dogfooding

The Coding Bible follows its own applicable `stable` rules.

The rule registry validates itself at runtime without an additional dependency,
and future deterministic analyzer rules will run against this repository before
they are considered ready for other projects.

A self-violation is treated as useful feedback: either the implementation is
wrong or the rule needs better scope, severity, or exceptions.

## Status

Foundation / pre-alpha. Rule quality and architecture come before visual polish.
