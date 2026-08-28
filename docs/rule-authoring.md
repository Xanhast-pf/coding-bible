# Rule Authoring Standard

A Coding Bible rule is an engineering claim, not a personal preference disguised
as one.

## Required fields

Every rule has:

- a permanent ID
- title
- summary
- rationale
- level
- pack
- status
- tags
- detection metadata

Examples and exceptions are required when they materially change how the rule is
understood.

## Levels

### MUST

Violation is expected to create a correctness, safety, accessibility,
maintainability, or architectural problem significant enough to reject during
review.

### SHOULD

The default engineering choice. Deviate only when the local trade-off is
understood and defensible.

### PREFER

A recommended pattern whose value depends on context. Do not enforce
mechanically without context.

### AVOID

A pattern with recurring disadvantages. It can still be valid when the
documented trade-off favors it.

## Status

- `draft`: still being evaluated; wording or meaning may change.
- `stable`: part of the public rule contract.
- `deprecated`: retained for compatibility/history but no longer recommended.

## Detection

Detection metadata describes what tooling may safely claim.

- `lint`: deterministic syntactic/static rule
- `ast`: structural code inspection
- `text`: deterministic text/pattern inspection
- `semantic`: contextual judgment; may require project context or AI

Never present a semantic heuristic as a deterministic compiler fact.

## Rule quality test

Before accepting a rule:

1. Can we state the problem without referring to a specific past codebase?
2. Does the rationale explain a real engineering cost?
3. Are exceptions honest and discoverable?
4. Is the severity proportional to the risk?
5. Could two reasonable engineers apply the rule consistently?
6. If auto-detected, can we explain likely false positives?
