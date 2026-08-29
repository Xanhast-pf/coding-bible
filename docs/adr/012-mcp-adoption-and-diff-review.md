# ADR-012: MCP adoption and change-focused review

- **Status:** Accepted
- **Date:** 2026-08-29

## Context

ADR-011 established a local, read-only MCP server with four tools. The first
integration proved the architecture, but two usability gaps remained:

1. agents had to know a canonical rule ID before `get_rule` was useful; and
2. project scans could surface historical debt when the actual task was to review
   one change.

MCP hosts also use slightly different configuration-file shapes. Requiring users
to hand-author those shapes makes a local integration unnecessarily fragile.

## Decision

Extend the MCP surface with two read-only tools:

- `search_rules` performs deterministic ranked discovery over canonical rule
  metadata and defaults to stable rules.
- `review_diff` accepts unified Git diff text, analyzes the corresponding current
  files through the existing project-aware analyzer, and filters diagnostics and
  findings to locations that intersect added or modified lines.

`review_diff` does not implement its own detectors. It also does not claim to
review deleted-only code or semantic rules. Existing baseline/config/tsconfig
behavior remains owned by the analyzer CLI.

The MCP CLI gains `--print-config` for Claude Code, Cursor, and VS Code. Generated
configuration uses absolute paths to the current Node executable, MCP entry
point, and requested project root so the setup does not depend on an MCP host's
working directory or shell parsing behavior.

Structured file-check responses retain the analyzer report but also expose
canonical rule references. The report parser validates the concrete version-1
summary/finding/diagnostic contract instead of leaving those fields as opaque
`unknown` arrays.

## Consequences

- Agents can discover relevant rules without guessing IDs.
- Pre-commit and PR review can focus on violations introduced by the change
  rather than unrelated existing debt.
- Client onboarding becomes copy/paste instead of hand-translating command
  arguments between host-specific configuration formats.
- Diff review assumes the current working tree represents the new side of the
  supplied diff. Quoted/unusual Git paths require unquoted `core.quotePath=false`
  diff output in this first implementation.
- The server remains local, stdio-only, path-bounded, and read-only; remote MCP
  serving and write/fix tools still require separate decisions.
