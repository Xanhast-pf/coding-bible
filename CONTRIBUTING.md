# Contributing

Rules are not added because they are fashionable or personally preferred.
Every rule must explain the engineering problem it solves.

Before adding a rule, answer:

1. What problem does this prevent?
2. Is it universal, ecosystem-specific, or project-specific?
3. Is it enforceable?
4. Can it produce false positives?
5. Is it a MUST, SHOULD, PREFER, or AVOID?
6. What are valid exceptions?
7. Can a human and an AI agent understand it from the rule alone?
8. If it is stable, does it have a short paired DON'T / DO example?

Do not encode repository-specific conventions into the universal rule pack.

## Rule IDs

Rule IDs are stable public identifiers and must never be reused.

Examples:

```text
ARCH-001
CORE-003
TS-004
REACT-006
PERF-002
TEST-005
AI-003
```
