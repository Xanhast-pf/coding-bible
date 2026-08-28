# ADR-007: Reference state is shareable through the URL

- Status: Accepted
- Date: 2026-08-28

## Context

Coding Bible is a reference tool. A developer should be able to share not only
an individual rule but also a useful filtered view such as all TypeScript MUST
rules matching "unknown".

## Decision

- Persist search, pack, and level filters in URL query parameters.
- Keep the individual rule anchor in the URL fragment.
- Use `history.replaceState` so filtering does not pollute browser history.
- Keep the implementation dependency-free.
- Expose copy actions for rule links and code examples.

Example:

```text
/coding-bible/?q=state&pack=react&level=must#REACT-004
```

## Consequences

- Search/filter views are bookmarkable and shareable.
- Deep links remain GitHub Pages-safe.
- No router or state-management dependency is required.
