# ADR-011: Local read-only MCP server

- **Status:** Accepted
- **Date:** 2026-08-29

## Context

ADR-010 added generated files that let agents consume Coding Bible without
scraping the website. Static context is useful, but an agent working on a local
project also benefits from callable operations: checking an unsaved snippet,
running the project-aware analyzer, retrieving one canonical rule, and selecting
guidance for the ecosystems actually present in a repository.

A new integration surface must not become another source of truth. Rule content
belongs to `packages/rules`, and deterministic analysis behavior belongs to
`packages/analyzer`.

## Decision

Add `packages/mcp`, a local stdio server using the stable v2
`@modelcontextprotocol/server` SDK. It exposes four tools:

- `check_code` delegates to the in-process analyzer for JS/TS snippets.
- `check_files` delegates to the existing analyzer CLI so config, tsconfig,
  baseline, Git scope, and report semantics stay centralized.
- `get_rule` reads the canonical rule registry and agent-prompt formatter.
- `get_project_guidance` includes all stable foundation/quality packs and selects
  ecosystem packs from dependencies found in local `package.json` manifests.

All four tools are annotated read-only. `check_files` forces `--no-cache` so an
MCP call does not create or update `.coding-bible/cache`. Caller-supplied scan,
config, and project paths are constrained to the server's configured root. That
boundary is a path guard, not an operating-system sandbox.

The first version is stdio-only. It does not add HTTP serving, authentication,
remote project access, write/fix tools, or a second rule/detector registry.

## Consequences

- Coding agents can query Coding Bible through a standard callable interface.
- MCP behavior inherits analyzer fixes instead of drifting into parallel scan
  logic.
- Project guidance stays conservative: ecosystem packs are selected only when
  package manifests provide evidence, including explicit implications such as
  Next.js → React and Apollo Client → GraphQL.
- A clean MCP analysis means only that implemented deterministic checks passed;
  semantic rules still require review.
- Remote serving can be considered later as a separate security/authentication
  decision rather than being bundled into the local integration.
