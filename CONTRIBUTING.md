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
10. Treat fix safety as a public contract. A `safe` fix must preserve intended
    semantics, survive in-memory re-analysis, and have a `git apply --check`
    regression. Behavior-sensitive transformations belong in `review`, never in
    the safe patch merely because the rewrite looks obvious.
11. Keep report fingerprints independent of line numbers so baselines, agents,
    and PR tooling can recognize a finding after unrelated lines move.

## Agent interface changes

The public agent files under `apps/web/public` are generated from the canonical
registry. Do not edit `llms.txt`, `llms-full.txt`, `rules.json`,
`rules.schema.json`, or `agents/*.txt` by hand.

After changing rules or the agent export contract, run:

```bash
pnpm agent:generate
pnpm agent:check
```

Backward-incompatible `rules.json` changes require a deliberate `formatVersion`
bump, schema updates, and regression coverage.

## Commit quality gates

Do not bypass the entire Git hook for routine development. The pre-commit hook
auto-fixes staged lint/format issues first, then runs affected tests, typecheck,
the agent-interface drift check, a fast Knip dependency pass, and Coding Bible as
the final staged-code gate.

If affected tests are temporarily disruptive, prefer the narrow bypass:

```bash
SKIP_AFFECTED_TESTS=1 git commit -m "message"
```

`SKIP_TYPECHECK`, `SKIP_AGENT_INTERFACE`, `SKIP_KNIP`, and `SKIP_BIBLE`
exist for exceptional local work, but the full `pnpm check` gate must pass before
code is pushed or merged. Pre-push and CI intentionally run the complete suite
rather than inheriting pre-commit bypasses.
