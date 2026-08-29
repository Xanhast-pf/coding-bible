# ADR-013: Self-contained GitHub Action and changed-line PR review

- **Status:** Accepted
- **Date:** 2026-08-29

## Context

Coding Bible already has a project-aware analyzer, baselines, stable rule IDs,
agent resources, and MCP diff review. Adoption in CI should not require each
consumer to understand the monorepo or install Coding Bible packages manually.
Pull-request feedback also needs to distinguish newly introduced findings from
historical debt in surrounding files.

GitHub JavaScript actions can execute a committed Node.js runtime directly from
a repository tag. GitHub annotations and Step Summaries provide a useful native
review surface without extra API permissions. SARIF adds Code Scanning support,
but SARIF upload has repository/permission requirements that should not be
required for the basic action.

## Decision

Expose `action.yml` at the repository root and run a committed, self-contained
Node 24 runtime from `packages/action/dist`.

The action:

1. defaults to `changed` scope;
2. derives the comparison base from the GitHub event or an explicit `base-ref`;
3. runs the canonical analyzer with project context on current changed files;
4. filters findings and syntax diagnostics to added/modified lines;
5. emits native GitHub annotations and a Step Summary;
6. honors analyzer configuration and baselines;
7. writes SARIF 2.1.0 for optional Code Scanning upload; and
8. fails according to the explicit `fail-on` policy.

The release tag is the consumer-facing version boundary. The runtime vendors the
analyzer implementation and exact TypeScript compiler used at build time, so
consuming workflows do not install Coding Bible, pnpm, or TypeScript.

SARIF upload is not performed by the Coding Bible action itself. Consumers that
want Code Scanning add GitHub's `upload-sarif` action and the required
`security-events` permission separately.

## Consequences

- `uses: Xanhast-pf/coding-bible@v0.25.0` is sufficient after checkout.
- Pull requests receive deterministic feedback only for changed lines while the
  analyzer still has full project/type context.
- Existing baselines remain a viable gradual-adoption mechanism.
- The repository must commit generated action runtime files and verify they do
  not drift from source.
- The committed runtime is larger because it includes TypeScript, but action
  execution has no dependency-install/network bootstrap step.
- A clean action run remains explicitly limited to implemented deterministic
  analyzer rules; semantic rules are not represented as automatically checked.
