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


## Analyzer changes

Analyzer changes must improve evidence, not merely increase the number of
findings. Keep detector coverage conservative and deterministic.

For every detector change:

1. Preserve lexical scope and symbol identity; do not rely on identifier names
   when the TypeScript checker can resolve the binding.
2. Add both a positive regression and the closest realistic negative case.
3. Prefer no finding over a suggestion that could change program semantics.
4. Keep the rule registry contract green: each automated DON'T must trigger its
   rule and each automated DO must parse with zero applicable findings.
5. Run the analyzer against Coding Bible itself before merging. Do not weaken a
   detector solely to make dogfooding green; fix the code or document a genuine
   exception.
6. Keep project scans deterministic: stable file ordering, stable finding
   ordering, and stable exit-code semantics are public behavior.
7. Do not bypass shared TypeScript Programs or indexes from a detector. Project
   scale must not multiply parser/compiler work by detector count.
8. Add scanner regression coverage for config, Git scope, or tsconfig behavior
   when changing those boundaries.
9. Use `--profile` and the synthetic benchmark before accepting analyzer changes
   that materially affect project-scale work.
