# ADR-005: Navigation remains dependency-free

- Status: Accepted
- Date: 2026-08-28

## Context

The site currently needs rule filtering, search, section navigation, and stable
deep links. GitHub Pages serves the project under `/coding-bible/`.

A client-side router would add dependency and routing complexity before the site
has route-shaped requirements.

## Decision

- Continue using fragment deep links for individual rules.
- Keep section filtering in application state.
- Add search and keyboard navigation with native browser APIs.
- Revisit routing only when multiple independently addressable page types exist.

## Consequences

- GitHub Pages refreshes remain reliable.
- Search and navigation stay lightweight.
- Rule URLs remain stable and shareable.
- A future router remains possible without changing rule IDs.
