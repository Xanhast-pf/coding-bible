# Coding Bible — Agent Instructions

## Mission

Coding Bible is a **rules-first engineering standard** and must dogfood its own standards.

The canonical rule content lives in `packages/rules`. The website, analyzer, CLI, GitHub Action, MCP server, generated agent interfaces, and other integrations are consumers of that source.

Preserve this architecture.

Do not duplicate or redefine canonical rule content inside consumers.

When making changes, distinguish carefully between:

- universal engineering rules;
- quality/reliability rules;
- ecosystem-specific contracts;
- deterministic analyzer findings;
- heuristic or semantic guidance.

A local convention, stylistic preference, or framework-specific behavior must not become a universal rule without a defensible engineering rationale.

---

## Core invariants

These are repository-level contracts.

- `packages/rules` is the canonical source of rule content.
- `apps/web` renders rules; it does not define them.
- `packages/analyzer` detects violations; it does not redefine rules.
- Rule IDs are public identifiers and must remain stable once published as stable rules.
- Deterministic findings must remain distinguishable from heuristic, contextual, semantic, or AI-assisted findings.
- Generated machine-facing artifacts must remain derived from the canonical registry.
- The repository must satisfy every applicable rule marked `stable`.
- A self-violation must never be silently waived merely to make checks pass.
- Correct code must not be distorted to satisfy an incorrect detector. Fix or refine the detector/rule instead.
- Analyzer claims must never exceed what the analyzer can actually prove.

When an architectural or public-contract change conflicts with one of these invariants, stop and explicitly justify the change rather than silently working around the contract.

---

## Environment

Required environment:

- Node.js: `>=24`
- pnpm: `10.15.0`

Install dependencies with:

```bash
pnpm install
```

The authoritative repository gate is:

```bash
pnpm check
```

Use existing repository scripts rather than inventing parallel build, lint, formatting, analysis, generation, or test commands when an existing script covers the task.

Before considering repository work complete, run `pnpm check` unless the task explicitly limits validation scope or an external blocker prevents it.

If the full gate cannot be run or does not pass, report exactly what was and was not validated.

---

## Implementation principles

Prefer:

- narrow TypeScript types;
- explicit data flow;
- small focused modules and components;
- native platform capabilities;
- semantic HTML;
- accessible interaction;
- CSS Modules where component styling is needed;
- minimal dependencies;
- compile-time guarantees where practical;
- simple local logic over unnecessary abstraction;
- deletion over compatibility layers that no longer serve a real requirement;
- evidence-driven optimization;
- existing repository conventions.

Avoid:

- `any`;
- hidden mutation;
- unnecessary global state;
- giant configuration objects;
- runtime CSS-in-JS;
- speculative abstractions;
- speculative architecture;
- narration comments that merely restate code;
- compatibility layers without a supported use case;
- dependencies for behavior the platform or a small local implementation already provides;
- broad refactors unrelated to the task.

Do not optimize merely for source-code cleverness. Prefer correctness, explainability, maintainability, and measurable production behavior.

---

# Rule authoring

Before adding or materially changing rules, read:

- `docs/rule-authoring.md`
- `docs/principles/source-distillation.md`

Every rule must have an intentional contract.

As applicable, rule metadata includes:

- stable ID;
- title;
- short summary;
- rationale;
- level/severity;
- pack;
- status;
- tags;
- detection metadata;
- exceptions;
- examples.

Stable rules require paired **DON'T / DO** examples.

Examples must accurately represent the rule rather than merely resemble the intended pattern.

## Rule quality

Before promoting a rule from `draft` to `stable`, challenge:

- whether the rule represents a genuine engineering concern;
- whether its rationale is defensible;
- whether its severity matches realistic impact;
- whether its scope is too broad;
- whether ecosystem-specific behavior has been incorrectly universalized;
- what legitimate exceptions exist;
- what likely false positives exist;
- whether deterministic detection is actually possible.

A preference without a defensible engineering rationale does not belong in the universal rule set.

Do not create rules merely to encode the current repository's implementation style.

---

## Rule IDs

Treat rule IDs as permanent public identifiers.

Do not casually:

- rename IDs;
- recycle deleted IDs;
- change an existing ID to mean something materially different;
- split or merge stable rule semantics under an existing ID without considering compatibility.

If rule semantics materially change, treat that as a public-contract decision.

---

# Ecosystem-specific rules

Framework and library contracts belong in their dedicated ecosystem packs.

Prefer current official framework/library documentation when establishing ecosystem-specific claims.

Do not universalize behavior simply because:

- one framework recommends it;
- one project uses it;
- it appeared in a prior codebase;
- it matches a maintainer preference.

If two ecosystems intentionally use different models, represent those differences honestly rather than forcing artificial consistency.

---

# Analyzer engineering

The analyzer exists to provide **trustworthy evidence**, not to maximize finding counts.

Keep detectors:

- small;
- focused;
- independently understandable;
- tied directly to canonical rule IDs;
- explainable;
- location-preserving.

Prefer AST or type-aware evidence over regex whenever syntax, scope, control flow, or symbol identity matters.

Regex is appropriate only when textual evidence is genuinely sufficient.

## Detection contract

For every automated rule:

- the exact canonical **DON'T** example must remain detectable;
- the exact canonical **DO** example must remain clean;
- legitimate exceptions must remain clean;
- findings must preserve useful source locations;
- confidence/applicability metadata must remain honest.

Do not label a semantic heuristic as a deterministic fact.

Do not claim that the analyzer reviewed or proved rules it cannot actually evaluate.

If detection is incomplete, represent that limitation explicitly.

---

## False positives

False positives are product defects.

When dogfooding or Canary reveals a finding against correct code:

1. reproduce the pattern in an analyzer fixture;
2. determine whether the rule or detector is wrong;
3. preserve a regression test;
4. refine the detector generically;
5. verify true-positive cases still fire;
6. verify canonical DON'T/DO examples remain correct.

Do not:

- change correct consumer code merely to silence a false positive;
- add repository-specific detector exceptions;
- silently suppress the finding;
- weaken severity to hide the problem;
- disable the rule without addressing its validity.

Fix the rule or detector at the correct abstraction level.

---

# Dogfooding

Coding Bible must follow its own applicable stable rules.

Dogfooding is part of the product validation strategy, not ceremonial CI.

When the repository violates one of its own stable rules:

- fix the repository if the finding is correct;
- refine the rule or analyzer if the finding is incorrect;
- document genuine exceptions where the rule contract supports them.

Never silently waive a self-violation.

Deterministic rules should be enforced by `packages/analyzer` when reliable detection is possible.

Semantic rules require explicit review rather than fake deterministic enforcement.

Canary/external-conformance failures should be treated as evidence about the analyzer contract, not merely obstacles to a green build.

---

# Analyzer parity

Automated rules must behave consistently across supported analyzer surfaces.

When changing analyzer behavior, consider all applicable consumers, including:

- core analyzer;
- CLI;
- browser analyzer;
- GitHub Action;
- MCP;
- SARIF/report output;
- custom-rule handling;
- changed/diff-only analysis.

A detector fix is incomplete if one supported execution surface continues to produce materially different results without an intentional documented reason.

---

# Generated agent interface

The public machine-facing files are generated from the canonical registry.

These include:

- `apps/web/public/llms.txt`
- `apps/web/public/llms-full.txt`
- `apps/web/public/rules.json`
- `apps/web/public/rules.schema.json`
- `apps/web/public/agents/*.txt`

Do not edit generated agent files by hand.

Generate them with:

```bash
pnpm agent:generate
```

Verify them with:

```bash
pnpm agent:check
```

`pnpm agent:check` must confirm that committed artifacts still match the canonical rule registry.

Breaking changes to `rules.json` require a deliberate `formatVersion` change together with corresponding schema, consumer, and test updates.

Generated output changing unexpectedly is evidence to investigate, not something to blindly commit.

---

# Public contracts

Treat these as compatibility-sensitive:

- stable rule IDs;
- rule registry schema;
- `rules.json`;
- analyzer result/report contracts;
- CLI behavior intended for automation;
- SARIF output;
- GitHub Action inputs/outputs;
- MCP tools/resources;
- custom-rule contracts;
- generated agent interfaces.

When changing a public contract:

1. determine whether the change is breaking;
2. update types/schema;
3. update tests;
4. update consumers;
5. update documentation;
6. update version/format markers when required.

Do not create accidental contract changes as side effects of internal refactoring.

---

# Web application

`apps/web` is a presentation layer over canonical rule data.

It must not become an alternate rule registry.

Prefer:

- semantic HTML;
- accessible controls;
- small focused React components;
- explicit state;
- CSS Modules;
- native browser behavior.

Avoid introducing application infrastructure without demonstrated need.

In particular, do not add a router merely for architectural neatness. While the static GitHub Pages application uses fragment-based navigation, fragments remain the deep-link contract.

Deployment target:

`https://xanhast-pf.github.io/coding-bible/`

Prefer fragment rule links such as:

```text
#TS-001
```

while that deployment architecture remains in place.

---

# Workspace constraints

TypeScript is intentionally a root development dependency because multiple workspaces, including `apps/web` and `packages/rules`, execute `tsc`.

Vite-specific ambient types belong in:

```text
apps/web/src/vite-env.d.ts
```

Do not leak `vite/client` into shared TypeScript configuration.

`esbuild` is explicitly permitted through `pnpm-workspace.yaml` `onlyBuiltDependencies`.

Preserve these boundaries unless the underlying architecture intentionally changes.

---

# Dependencies

Keep dependencies minimal.

Before adding a dependency, ask:

1. can the platform already do this?
2. does the repository already contain the required capability?
3. is the dependency justified by substantial complexity or correctness benefits?
4. what runtime, bundle, maintenance, and supply-chain cost does it introduce?

Do not add dependencies merely to avoid writing small straightforward code.

Remove obsolete dependencies when their final usage disappears.

---

# Testing

Tests should protect contracts and behavior, not implementation accidents.

When fixing a defect:

1. reproduce it;
2. add or identify a failing test;
3. implement the smallest correct fix;
4. verify nearby positive and negative cases;
5. run the appropriate broader validation.

For analyzer defects, regression tests should normally include both:

- the previously misclassified case;
- nearby cases that must continue producing findings.

Do not weaken tests merely because a refactor made them inconvenient.

If a test encodes behavior the underlying platform does not guarantee, verify that assumption before changing production code to satisfy it.

---

# Performance and size

Do not trade correctness for micro-optimizations.

When optimizing:

- measure before and after;
- identify retained dependencies when bundle size is involved;
- prefer deletion over source golfing;
- keep only experiments that provide measurable value;
- revert unsuccessful experiments;
- preserve behavior and public contracts.

Do not manipulate baselines or accounting merely to make a gate pass.

A budget change must represent an intentional engineering/product decision, not a workaround for an unexplained regression.

---

# Documentation and architecture decisions

Update documentation when behavior, public contracts, architecture, rule semantics, or contributor expectations materially change.

Use ADRs or equivalent architectural documentation for decisions whose rationale future maintainers will need.

Documentation should explain **why** a non-obvious contract exists, not narrate obvious implementation details.

Keep investigation artifacts only when they provide durable engineering evidence.

---

# Scope discipline

Keep changes focused on the requested task.

Before finishing:

- inspect the final diff;
- remove temporary instrumentation;
- remove debug logging;
- remove abandoned experiments;
- remove dead helpers;
- remove unused exports;
- remove obsolete dependencies;
- remove stale comments;
- ensure generated files are intentionally generated.

Do not opportunistically rewrite unrelated areas of the repository.

If unrelated defects are discovered, report them separately unless they block the requested work.

---

# Validation and completion

Use focused checks while iterating.

Before declaring repository-level work complete, run:

```bash
pnpm check
```

unless explicitly prevented by task scope or an external blocker.

For substantial analyzer/rule changes, also verify the relevant:

- canonical rule tests;
- analyzer tests;
- DON'T/DO detection contract;
- Canary/conformance coverage;
- generated agent artifacts;
- CLI/report behavior;
- affected integration surfaces.

A task is not complete merely because the code compiles.

Completion means:

- behavior is correct;
- contracts remain honest;
- tests protect the change;
- generated artifacts are synchronized;
- documentation is accurate;
- dead experimental code is gone;
- applicable quality gates pass.

If anything remains unverified, state it explicitly.

---

## Final principle

Coding Bible should be stricter about the **truthfulness of its engineering claims** than about producing more rules or more findings.

Prefer:

**fewer trustworthy rules, fewer trustworthy findings, and explicit limitations**

over:

**broad rules, noisy detection, false certainty, or green checks achieved through workarounds.**
