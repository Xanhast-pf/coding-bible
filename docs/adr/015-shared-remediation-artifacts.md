# ADR-015: Remediation artifacts are shared, explicit, and non-mutating by default

- Status: Accepted
- Date: 2026-09-08

## Context

Coding Bible now serves the same deterministic findings through the CLI, browser,
GitHub Action, and MCP server. v0.28 also adds richer remediation outputs:
versioned reports, prioritized Fix Packs, Review Briefs, safe patches, and
review-required patches.

If each consumer derives those artifacts independently, ordering, severity,
confidence, patch classification, and finding metadata will drift. The same is
true for baselines: a maintenance command that silently absorbs newly introduced
debt would turn the baseline from an adoption tool into an escape hatch.

The integration surfaces also have different trust boundaries. A local CLI can
write requested files, a browser can offer downloads, a GitHub Action runs inside
a checkout, and an MCP server may be invoked autonomously by an agent.

## Decision

Keep remediation semantics in `@coding-bible/analyzer` and make consumers adapt
that shared contract instead of reimplementing it.

1. **One artifact model.** Report, Fix Pack, Review Brief, finding metadata, and
   patch generation are analyzer-owned contracts. Consumers may choose where to
   present or write them, but must not reinterpret finding priority or patch
   safety independently.
2. **Separate safe and review-required changes.** Deterministic edits that meet
   the analyzer's safe-fix contract are never mixed with edits that require human
   or agent judgment.
3. **No implicit source mutation.** Generating a Fix Pack or Review Brief never
   applies a patch. Applying source changes remains an explicit caller action.
4. **Browser output stays local.** Browser remediation artifacts are created from
   local analysis and offered as downloads. Source is not uploaded to a Coding
   Bible service.
5. **GitHub Action output is advisory.** The Action may write report/remediation
   artifacts under `.coding-bible` for the job and expose their paths as outputs,
   but it does not apply source patches to the checkout.
6. **MCP planning is read-only.** `plan_fixes` returns the shared prioritized plan
   without modifying source files, analyzer caches, or baseline state.
7. **Baseline pruning is subtractive only.** `baseline prune` may remove stale
   fingerprints. It must never add newly discovered findings; adopting new debt
   requires the explicit baseline creation/update path.
8. **Version shared machine contracts.** Backward-incompatible report or Fix Pack
   schema changes require a format-version change rather than silent shape drift.

## Consequences

- CLI, browser, Action, and MCP review the same evidence in the same order.
- Agents can request remediation planning without granting Coding Bible an
  implicit write path into the project.
- Safe automation can grow over time without weakening the boundary around
  judgment-required edits.
- Baselines remain suitable for gradual adoption because pruning cannot hide new
  violations.
- Consumer-specific presentation code stays small, while analyzer artifact
  contracts require stronger regression coverage because more surfaces depend on
  them.
