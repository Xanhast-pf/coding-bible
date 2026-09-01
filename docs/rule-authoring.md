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

Every `stable` rule also requires a paired **DON'T / DO** example. Examples are
kept short enough to scan before reading the rationale and should demonstrate the
smallest realistic contrast that teaches the rule. Draft or deprecated rules may
omit examples when a concrete snippet would be artificial or misleading.

Exceptions are required when they materially change how the rule is understood.

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

## Repository layout

Every Bible rule owns one source file whose name starts with its permanent rule ID:

```text
packages/rules/src/rules/react/
  REACT-009-follow-the-rules-of-hooks.ts
```

Automated implementations mirror the same convention:

```text
packages/analyzer/src/detectors/react/
  REACT-009-hook-placement.ts
```

A rule may expose more than one detector strategy from its rule-owned analyzer file
(for example, missing and unstable list-key checks for `REACT-006`). Generic AST
helpers shared by multiple rules use an underscore-prefixed helper module and must
not contain rule-specific findings.

Do not hand-edit pack barrels or `packages/analyzer/src/detectors/registry.generated.ts`.
They are generated from rule-prefixed filenames. `detectors/index.ts` stays a small,
stable public entry point so generated registry churn does not conflict with runtime metadata:

```bash
pnpm registries:generate
pnpm registries:check
```

### Adding a rule

Start a draft with the scaffold command:

```bash
pnpm rule:new -- --id REACT-014 --title "Prefer explicit event ownership"
```

Then:

1. Fill in the summary, rationale, level, tags, and exceptions where needed.
2. Add paired DON'T / DO examples before moving the rule to `stable`.
3. If the rule becomes automated, add one matching detector file under the
   analyzer pack directory and export `<ruleIdWithoutDash>Detectors` (for example
   `react014Detectors`).
4. Add focused regression coverage for the detector plus any project/browser
   behavior it relies on.
5. Run `pnpm registries:generate`, then `pnpm check`.

The generated registry check intentionally fails when a new prefixed file has not
been wired into the checked-in barrels. This keeps adding rules mechanical while
keeping runtime imports static and bundler-friendly.
