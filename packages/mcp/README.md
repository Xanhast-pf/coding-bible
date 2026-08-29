# @coding-bible/mcp

Local stdio MCP server for Coding Bible.

The server is deliberately read-only from an agent's perspective: it analyzes
code, reads project files/manifests, and returns canonical rule guidance. The
`check_files` tool disables the analyzer result cache so an MCP call does not
write `.coding-bible/cache` as a side effect.

## Tools

- `check_code` — deterministic checks for an in-memory JS/TS snippet.
- `check_files` — project-aware analyzer scan for files/directories under the
  configured root.
- `get_rule` — canonical rule data plus the rule's agent prompt.
- `get_project_guidance` — compact guidance using all stable foundation/quality
  rules plus ecosystem packs detected from local `package.json` files.

A clean analyzer result covers only deterministic rules implemented by
`@coding-bible/analyzer`; it does not claim that semantic rules were reviewed.

## Run

From the Coding Bible repository:

```bash
pnpm mcp --root /absolute/path/to/project
```

For an MCP host that accepts a command and argument list, point it at the same
local command. `--root` defaults to the server process working directory and
prevents tool callers from explicitly targeting paths outside that directory.
It is a path guard, not an operating-system sandbox.

The stdio protocol owns stdout. Runtime status and errors go to stderr.

## Canonical links

Rule responses point to:

```text
https://xanhast-pf.github.io/coding-bible/
```

Use `--canonical-url` to override that base for a fork or local deployment.
