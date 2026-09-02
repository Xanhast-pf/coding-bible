# Coding Bible custom-rule implementation brief

You are implementing or refining an engineering rule for Coding Bible.

## Requested policy

- **Rule ID:** {{RULE_ID}}
- **Title:** {{RULE_TITLE}}
- **Requested mode:** {{MODE}}

### Goal

{{RULE_GOAL}}

### Additional notes

{{NOTES}}

## Current checkout capabilities

{{CAPABILITIES}}

## Implementation decision

{{MODE_GUIDANCE}}

{{SCOPE_GUIDANCE}}

## Read these files before editing

1. `docs/principles/tooling-boundaries.md`
2. `docs/principles/extensible-rules.md`
3. `packages/analyzer/README.md`
4. `packages/analyzer/src/types.ts`
5. `packages/analyzer/src/customRules.ts`
6. `packages/analyzer/src/analyze.ts`
7. `scripts/rules/new-rule.mjs`
8. The closest existing rule, detector, and detector regression tests for this
   kind of policy.

{{EXTRA_CONTEXT}}

Do not rely on this prompt as a substitute for reading the current source. The
repository contracts are authoritative if they differ from an assumption in this
brief.

## Non-negotiable Coding Bible constraints

- Coding Bible complements ESLint, Prettier, TypeScript, compilers, tests, and
  human review. Do not recreate diagnostics those tools already own unless the
  Coding Bible rule adds materially different engineering judgment.
- Prefer no finding over a finding that requires guessing.
- Do not weaken confidence, suppress Coding Bible, or broaden exclusions merely
  to make the repository gate green.
- Do not invent declarative matcher syntax. Use only the matcher contract that
  exists in the current checkout.
- Keep findings narrow and explainable from the evidence the analyzer actually
  has.
- `contextual` findings require a useful `contextNote`. Use `strong` or `certain`
  only when the evidence supports it.
- Do not manually edit generated detector registries or generated agent files.
- Do not add unsafe type assertions when validation or narrowing can prove the
  type.
- Do not reparse source independently inside detectors when the shared
  TypeScript Program, checker, indexes, or utilities already provide the needed
  context.
- Preserve deterministic ordering, fingerprints, and cache behavior.
- Preserve Web / CLI / GitHub Action parity for portable declarative policy.

## Declarative-rule path

Choose this path only when the current declarative DSL can express the policy
without approximation.

- Keep the rule self-describing: ID, title, rationale, confidence, impact,
  message, suggestion, and context note when needed.
- Prefer a versioned local JSON rulebook for team-scale policy when the current
  checkout supports `customRuleFiles`; inline `customRules` remains appropriate
  for small policies.
- Use existing rule severity, file overrides, and include/exclude mechanisms
  instead of inventing rule-specific configuration.
- Add validation/integration coverage for the policy shape and at least one
  realistic violating and non-violating case.
- If the checkout provides `rulebook:new` / `rulebook:validate`, use those instead
  of hand-copying an old rulebook contract.
- Confirm the same declarative rule behaves consistently in the supported
  consumers.

If the current DSL cannot express the policy precisely, do **not** approximate it
with string matching or an overly broad matcher. Explain why a full detector is
required instead.

## Full-detector path

Choose this path when the rule requires symbol identity, TypeScript checker
information, project relationships, control/data relationships, or AST semantics
the portable DSL cannot represent safely.

{{DETECTOR_GUIDANCE}}

For a full detector:

- inspect the nearest existing detector before writing new traversal or utility
  logic;
- choose `source-file` versus `project` dependency scope deliberately;
- declare an inline finding profile;
- use the canonical rule ID and a unique detector ID;
- create the smallest evidence range that explains the finding;
- add the canonical DON'T / DO examples when this is a public Coding Bible rule;
- add both a positive regression and the closest realistic negative case;
- add project/config/tsconfig regression coverage if the detector depends on
  those boundaries;
- treat auto-fix safety as a separate contract from detection confidence.

## Acceptance criteria

Before calling the task complete:

1. State whether the implementation is declarative or a full detector and why.
2. The requested policy is represented without silently broadening its meaning.
3. A realistic violating example produces the intended finding.
4. The closest realistic valid example does not produce that finding.
5. Confidence and impact accurately describe what static analysis can prove.
6. Existing generated-file boundaries are respected.
7. No unrelated refactor is bundled into the change.
8. Run the relevant focused tests.
9. Run repository generation/build steps required by the changed surfaces.
10. Run `pnpm check` and leave the repository green.

The normal final command is:

```bash
pnpm check
```

`pnpm check` owns deterministic generation, ESLint auto-fixes, and Prettier before
running the strict repository verification sequence. Do not duplicate those
mechanical steps manually unless you are debugging one of them. CI and pre-push
use the non-mutating `pnpm check:ci` variant.

## Final response

Report:

1. implementation path chosen and why;
2. files changed;
3. detector/rule semantics;
4. tests and edge cases added;
5. commands actually run and their results;
6. any limitation, contextual uncertainty, or human review still required.

Do not claim the rule is correct merely because tests pass. Explain why the
implemented evidence matches the engineering policy.
