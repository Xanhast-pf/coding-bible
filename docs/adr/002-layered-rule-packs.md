# ADR-002: Rules are organized into layered packs

- Status: Accepted
- Date: 2026-08-28

## Decision

Rules are grouped into composable packs under three reader-facing layers:

```text
Foundations
  accessibility
  architecture
  core
  css
  javascript
  typescript

Quality
  ai
  dependencies
  feature-flags
  internationalization
  performance
  testing
  workflow

Ecosystem
  apollo
  graphql
  legend-state
  nextjs
  react
  redux
  tanstack-query
```

The canonical pack list and grouping live in `packages/rules/src/types.ts`; this
ADR records the layering decision rather than creating a second configuration
source.
