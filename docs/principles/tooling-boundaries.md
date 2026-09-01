# Tooling boundaries

Coding Bible is an engineering-standards system. It is not a formatter, compiler,
type checker, test runner, or general-purpose linter.

Its job is to codify reusable engineering judgment, automate the subset that can
be defended with static evidence, and make the same canonical guidance useful to
humans, CI, and AI coding agents.

## Ownership rule

Before adding a rule, detector, or integration, ask these questions in order:

1. **Does an established tool already own this problem better?** If yes, defer to
   or integrate with that tool unless Coding Bible adds materially different
   engineering reasoning.
2. **Is this a reusable engineering standard?** Repository-specific style and
   team-local preferences should stay project-specific unless their rationale
   survives outside the source repository.
3. **Can static analysis defend the conclusion?** Automate only when the evidence
   supports a useful confidence level. Otherwise keep the rule available for
   human or agent review.
4. **Can the remediation be defended?** A detectable violation does not imply a
   mechanically safe edit. Safe fixes, review fixes, and guidance-only findings
   remain separate concepts.

## Division of responsibility

| Tool | Owns |
| --- | --- |
| Prettier | Formatting and layout |
| ESLint | General-purpose linting and ecosystem diagnostics |
| TypeScript | Type-system correctness |
| Compiler / build tools | Parsing, transformation, bundling, and executable output |
| Tests | Behavioral expectations and regressions |
| Coding Bible | Explainable engineering standards and defensible automated review |
| Human / AI reviewer | Architecture, intent, tradeoffs, and context-aware remediation |

Coding Bible may surface syntax diagnostics when malformed code prevents honest
analysis, but it does not become the compiler. It may overlap with an ecosystem
lint rule when the Bible adds a durable engineering rationale, canonical examples,
confidence metadata, or agent-facing guidance; duplication by itself is not a
reason to add a detector.

## Analyzer contract

The analyzer is one consumer of the Bible, not the product definition.

A clean analyzer result means only that no violation was found among the
applicable automated rules. It never means that every Coding Bible rule was
reviewed or that the codebase is correct in every dimension.

Detectors should therefore:

- prefer no finding over a speculative finding;
- communicate confidence separately from enforcement severity;
- attach context when runtime intent or surrounding architecture can change the
  conclusion;
- avoid guessing at architecture, naming quality, business logic, or other
  concerns that require broader judgment;
- never encourage disabling or suppressing a rule merely to make a report green.

## Humans and AI agents

Coding Bible should make reviewers and coding agents more focused, not try to
replace them.

The intended loop is:

1. **Prevent** — expose applicable standards before code is written.
2. **Detect** — identify defensible violations deterministically.
3. **Focus** — provide compact canonical context about the relevant rules.
4. **Remediate** — let a human or capable coding agent reason about the correct
   change.
5. **Verify** — re-run Coding Bible and the rest of the project's quality gates.

Machine-facing integrations should stay vendor-neutral. Coding Bible supplies
standards, evidence, and verification context; the coding agent remains
responsible for repository reasoning and implementation.

## Scope guard

Coding Bible should generally not recreate formatting rules, generic compiler
errors, basic type errors, unused-symbol diagnostics, or other checks already
owned by mature tools unless the Bible contributes a distinct engineering
standard that remains useful outside that diagnostic.

The guiding principle is:

> We do not collect diagnostics. We codify engineering judgment.
