# ADR-010: Publish a generated, versioned agent interface

- Status: Accepted
- Date: 2026-08-29

## Context

Coding Bible already exposes structured rules to its website, analyzer, CLI, and
copyable `tldr;` prompts. Coding agents should not need to scrape rendered HTML or
reverse-engineer internal TypeScript modules to consume the same canonical rule
set.

The public site is hosted at a GitHub Pages project path, so the agent interface
must work without a backend and without assuming control of the origin root.
Agent-facing exports must also avoid becoming a second hand-maintained source of
truth.

## Decision

Publish a generated agent interface from the canonical rule registry:

- `llms.txt` as the concise discovery surface;
- `llms-full.txt` as complete Markdown rule context;
- `rules.json` as the versioned machine-readable contract;
- `rules.schema.json` as the contract schema; and
- `agents/*.txt` as compact all-rules and per-pack prompts.

`rules.json` exposes an explicit integer `formatVersion`. Backward-incompatible
contract changes require a version bump. Rule IDs remain the stable identifiers
inside that contract.

The generated files are committed for static hosting, but they are never edited
manually. `pnpm agent:generate` regenerates them and `pnpm agent:check` fails when
committed output drifts from the registry. The repository quality gates include
the drift check.

The HTML entry point advertises its covering `llms.txt` with `rel="describedby"`
so agents can discover the machine-readable surface without guessing.

## Consequences

- Agents get compact discovery, full text, and structured JSON from one canonical
  source.
- GitHub Pages can serve the interface with no runtime API.
- Per-pack prompts provide a practical filtered context without multiplying the
  canonical rule store.
- Contract consumers can pin behavior to `formatVersion` and validate against the
  published schema.
- Rule changes now require generated agent artifacts to stay synchronized.
