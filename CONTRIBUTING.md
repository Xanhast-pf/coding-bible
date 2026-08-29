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

## GitHub Action changes

The GitHub Action is a read-only CI consumer of the canonical analyzer. It must
not fork detector behavior or redefine rule content.

When changing the Action:

1. Keep `action.yml` inputs/outputs backward-compatible within a release line.
2. Preserve changed-line filtering: analyze with project context, then report
   only added/modified-line findings for `scope: changed`.
3. Keep the default path permission-light. Native annotations and Step Summaries
   must work with `contents: read`; SARIF upload stays an explicit consumer step.
4. Do not add a runtime package-install/bootstrap step. The committed runtime is
   self-contained and generated with `pnpm action:build`.
5. Run `pnpm action:check` after analyzer or rule-interface changes. Drift in
   `packages/action/dist` is a release-blocking failure.
6. Keep failure semantics explicit through `fail-on`; syntax diagnostics remain
   failures unless the consumer chooses `none`.
7. Do not imply semantic-rule coverage. Report the deterministic rule count
   actually exercised by the analyzer.
8. Add regression coverage for Git diff edge cases, annotation escaping, SARIF,
   and any new input/output contract.

## MCP changes

The MCP server is a read-only consumer of `packages/rules` and
`packages/analyzer`; it must not redefine rule content or detector behavior.

When changing MCP tools:

1. Keep tool contracts small, explicit, and covered by regression tests.
2. Reuse the in-process analyzer for snippets and the existing project-aware CLI
   for filesystem scans rather than duplicating analyzer behavior.
3. Preserve the configured root boundary for caller-supplied filesystem paths.
4. Keep filesystem-backed tools free of analyzer cache writes so read-only tool
   annotations remain honest.
5. Diff-review tools must filter analyzer output rather than duplicating detector
   logic or silently treating unchanged context as newly introduced debt.
6. Keep protocol traffic on stdout and diagnostics/runtime logging on stderr.
7. State deterministic analyzer coverage precisely; semantic review is not
   implied by a clean scan.
8. Keep client setup examples/config generation aligned with current host
   documentation and covered by tests where the shapes differ.

## Commit quality gates

Do not bypass the entire Git hook for routine development. The pre-commit hook
auto-fixes staged lint/format issues first, then runs affected tests, typecheck,
the agent-interface and GitHub-Action runtime drift checks, a fast Knip dependency pass, and Coding Bible as
the final staged-code gate.

If affected tests are temporarily disruptive, prefer the narrow bypass:

```bash
SKIP_AFFECTED_TESTS=1 git commit -m "message"
```

`SKIP_TYPECHECK`, `SKIP_AGENT_INTERFACE`, `SKIP_ACTION_RUNTIME`, `SKIP_KNIP`, and `SKIP_BIBLE`
exist for exceptional local work, but the full `pnpm check` gate must pass before
code is pushed or merged. Pre-push and CI intentionally run the complete suite
rather than inheriting pre-commit bypasses.
