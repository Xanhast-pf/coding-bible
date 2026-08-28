# ADR-001: Rules are canonical structured data

- Status: Accepted
- Date: 2026-08-28

## Context
The same engineering rules should eventually power documentation, search,
AI context, static analysis, CLI output, editor integrations, and PR review.

## Decision
The canonical source of every rule lives in `packages/rules` as typed structured
data. The website renders that data.

## Consequences
- Rule IDs become stable public contracts.
- Presentation stays independent from rule content.
- Tooling does not need to scrape documentation.
