# Extensible rules

Coding Bible is opinionated by default, not closed by design.

The public rule catalog should capture engineering standards that remain useful
outside the repository or company that inspired them. A team can still have
important local policy that should not become universal law. Coding Bible must
support both without forcing either group to maintain a separate analyzer.

## Two extension paths

### 1. Declarative organization rules

Portable custom rules can live inline in `coding-bible.config.*` or in versioned
local JSON rulebooks referenced through `customRuleFiles`.

They are data, not arbitrary executable plugins. That property is intentional:
the same rule can be loaded safely by browser Project mode, the CLI, and the
self-contained GitHub Action.

Rulebooks use an explicit `formatVersion`, stay relative to the Coding Bible
config directory, and merge with inline rules into one validated policy. Duplicate
IDs, path escapes, unsupported versions, and missing files fail loudly.

The first matcher set targets high-value policies that static syntax can defend:

- restricted module imports/re-exports;
- restricted literal call expressions.

The DSL can expand, but every matcher must remain:

- deterministic;
- explainable from local evidence;
- safe to load from JSON in a browser;
- representable in reports and agent context;
- compatible across web, CLI, and Action.

A custom rule is self-describing. It owns an ID, title, rationale, message,
suggestion, impact, confidence, optional context note, optional language scope,
and optional HTTPS documentation URL.

### Authoring should fail early

A team should not need to run a full repository analysis just to discover that a
rulebook is malformed. Coding Bible therefore treats authoring UX as part of the
rule contract:

- `pnpm rulebook:new` scaffolds a valid versioned rulebook with conservative
  confidence defaults;
- the generated rulebook points at the public JSON Schema for editor autocomplete
  and inline validation;
- `pnpm rulebook:validate` runs the same runtime validator used by the analyzer and
  also catches collisions across multiple rulebooks or with built-in automated IDs;
- the JSON Schema is generated and checked for drift in the normal repository gate.

The schema improves authoring, but runtime validation remains authoritative. A JSON
Schema editor hint must never become a second implementation of analyzer semantics.

### 2. Full detectors for contributors and forks

Some rules require TypeScript symbols, project context, control relationships, or
specialized AST reasoning. Those should use the normal detector API rather than
stretching the declarative DSL into a programming language.

`pnpm rule:new -- --id ... --title ... --detector` scaffolds the canonical rule
and an analyzer module together. The detector owns an inline finding profile and
the generated registry discovers detector modules across every rule pack.

The goal is simple:

> Adding detector #100 should not require understanding or editing ten registries.

Generated files remain generated. A contributor should implement the rule,
detector, examples, and tests; repository tooling should handle wiring.

### AI-assisted authoring is a context handoff

Coding Bible may help a developer hand rule-authoring work to an AI agent, but it
must do so by exporting the architectural constraints rather than asking the
agent to rediscover them from scratch.

`pnpm rule:prompt` generates a compact implementation brief containing the
requested policy, the current extension capabilities, the declarative-vs-detector
decision boundary, required repository files to inspect, testing expectations,
and the final quality gates. The prompt stays vendor-neutral: Coding Bible
provides focused engineering context and lets the developer choose the agent.

The brief must never tell an agent to make findings disappear at any cost. It
should bias toward the smallest defensible implementation, honest confidence,
narrow evidence, realistic negative tests, and explicit human review when static
analysis cannot prove the conclusion.

## Core and custom policy are peers at runtime

Once a custom rule is loaded, its finding should participate in the normal
analyzer flow:

- rule enable/disable and severity config;
- file overrides;
- browser, CLI, and Action analysis;
- JSON/SARIF/report output;
- baselines and fingerprints;
- future Review Brief / Fix Pack exports.

A custom finding must not become an opaque warning. Its rationale and optional
documentation URL travel with the finding so a human or AI agent can understand
why the organization cares about it.

## Trust boundaries

Declarative project rules are portable because they contain no executable code.

Executable third-party detector plugins are deliberately not part of this first
contract. A future plugin SDK needs an explicit trust, dependency, cache
invalidation, packaging, and Action-distribution model. Until then, full custom
detectors belong in a controlled fork or analyzer wrapper through the additive
detector API.

This constraint protects the local-first browser analyzer and keeps the
self-contained Action honest.

## Admission principle

Before extending the declarative DSL, ask:

1. Can the policy be detected from static evidence with useful confidence?
2. Can the matcher semantics be explained in one short paragraph?
3. Can it run identically in browser, CLI, and Action?
4. Does it avoid duplicating ESLint, TypeScript, Prettier, compiler, or test
   responsibilities?
5. Will the resulting finding give a human or agent enough information to act?

If the answer is no, keep the rule as guidance or implement a full detector
instead of weakening the analyzer's trust model.
