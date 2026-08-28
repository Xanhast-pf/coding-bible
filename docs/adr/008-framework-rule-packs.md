# ADR-008: Framework rules live in dedicated packs with official references

- Status: Accepted
- Date: 2026-08-28

## Context

Some engineering rules are universal; others only make sense inside a specific
framework or state/data library. Treating framework behavior as universal law
creates misleading guidance and contradictions.

## Decision

- Framework-specific guidance lives in dedicated rule packs.
- Framework rules should link to current official documentation when a public
  authoritative source exists.
- Project-specific conventions are not promoted into framework packs unless they
  represent an actual framework constraint.
- Framework packs may intentionally disagree when the frameworks have different
  models. For example, Redux strongly prefers serializable store state while
  Legend-State itself supports richer observable values; serialization is only
  mandatory when Legend-State data crosses a serialization boundary.

Initial ecosystem packs:

```text
Apollo Client
GraphQL
Legend-State
Next.js
React
Redux
TanStack Query
```

## Consequences

- Readers can distinguish general engineering doctrine from ecosystem contracts.
- Rules are easier to keep current when a framework changes.
- Official references provide an audit trail for framework-specific claims.
- Additional ecosystems can be added without diluting the universal rule set.
