# ADR-004: The repository dogfoods stable rules

- Status: Accepted
- Date: 2026-08-28

## Context

A project that publishes engineering standards loses credibility if its own
source code knowingly violates those standards.

At the same time, not every rule applies to every file, and draft or heuristic
rules should not be treated as deterministic build failures.

## Decision

The Coding Bible repository follows every applicable rule marked `stable`.

Compliance is layered:

1. **Type system and build checks** enforce what they can prove.
2. **Rule-registry validation** enforces rule metadata invariants without an
   external dependency.
3. **Future analyzer checks** will enforce deterministic Coding Bible rules
   against this repository before they are offered to other projects.
4. **Human review** remains responsible for semantic rules that cannot be proven
   mechanically.

A failure may reveal either:

- a defect in this repository, or
- a rule that is too broad, too strict, or missing a valid exception.

Both outcomes require fixing the underlying inconsistency rather than silently
ignoring it.

## Consequences

- The repository becomes the reference implementation for its own standards.
- Rules are continuously tested against real production code.
- Overly dogmatic rules are more likely to be discovered early.
- Stable rules carry a higher maintenance obligation than draft rules.
