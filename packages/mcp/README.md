# @coding-bible/mcp

Local stdio MCP server for Coding Bible.

The MCP server is a context bridge for coding agents, not a coding agent itself.
It helps an agent quickly identify applicable engineering standards, inspect
canonical rule guidance, and focus on deterministic analyzer findings while the
agent remains responsible for repository reasoning and implementation.

The server is deliberately read-only from an agent's perspective: it analyzes
code, reads project files/manifests, and returns canonical rule guidance. File
analysis disables the analyzer result cache so an MCP call does not write
`.coding-bible/cache` as a side effect.

This keeps Coding Bible vendor-neutral: the same standards and evidence can guide
any capable agent without coupling the project to one model or remediation
engine.

## Two-minute setup

Install Coding Bible once, then generate the exact config shape expected by your
MCP host:

```bash
pnpm install
pnpm mcp --root /absolute/path/to/project --print-config cursor
pnpm mcp --root /absolute/path/to/project --print-config vscode
pnpm mcp --root /absolute/path/to/project --print-config claude-code
```

The generated command uses absolute paths to the current Node executable, this
repository's MCP entry point, and the project root. That avoids depending on the
MCP host's working directory or shell command parsing.

### Cursor

Save the `--print-config cursor` output as either:

- `.cursor/mcp.json` for a project configuration, or
- `~/.cursor/mcp.json` for a personal configuration.

Cursor uses the `mcpServers` configuration shape for local stdio servers.

### VS Code / GitHub Copilot

Save the `--print-config vscode` output as `.vscode/mcp.json`, or merge the
`coding-bible` entry into your user MCP configuration. VS Code uses a top-level
`servers` object rather than Cursor/Claude's `mcpServers` object.

### Claude Code

The `--print-config claude-code` output is a complete `--mcp-config` file:

```bash
pnpm mcp --root /absolute/path/to/project --print-config claude-code > /tmp/coding-bible-mcp.json
claude --mcp-config /tmp/coding-bible-mcp.json
```

Claude Code can also register the same stdio command permanently with
`claude mcp add` / `claude mcp add-json`.

## Tools

- `check_code` — deterministic checks for an in-memory JS/TS snippet. Best for
  pasted or unsaved code.
- `check_files` — project-aware analyzer scan for files/directories under the
  configured root, including config/tsconfig/baseline semantics.
- `review_diff` — analyzes current working-tree files and returns only findings
  that touch added or modified lines from a supplied unified Git diff.
- `search_rules` — ranked canonical rule discovery when the caller knows the
  concept but not the exact rule ID.
- `get_rule` — canonical rule data plus the rule's agent prompt when the ID is
  already known.
- `get_project_guidance` — stable foundation/quality guidance plus ecosystem
  packs detected from local `package.json` files.

`check_files` and `review_diff` include canonical rule references in structured
output. `review_diff` intentionally ignores findings that exist only on unchanged
context lines, so historical project debt does not drown out the change being
reviewed.

A clean analyzer result covers only deterministic rules implemented by
`@coding-bible/analyzer`; it does not claim that semantic rules were reviewed.
`review_diff` also cannot reason about deleted-only code because that code no
longer exists in the current working tree.

## Suggested agent workflows

Useful prompts once the server is connected:

```text
Use Coding Bible to inspect this repository and tell me which rule packs apply.

Search Coding Bible for guidance about unsafe type assertions, then show me the
full rules you think are relevant.

Review my current git diff with Coding Bible. Focus on violations introduced by
this change, not pre-existing findings elsewhere in the project.

Check src/features/account against Coding Bible and explain every deterministic
finding with its canonical rule.
```

For diff review, pass ordinary `git diff` / `git diff --cached` unified text to
`review_diff`. The working-tree files must represent the new side of the diff.
For Git paths that are quoted because of unusual characters, generate input with
`git -c core.quotePath=false diff`.

## Run directly

From the Coding Bible repository:

```bash
pnpm mcp --root /absolute/path/to/project
```

`--root` defaults to the server process working directory and prevents tool
callers from explicitly targeting paths outside that directory. It is a path
guard, not an operating-system sandbox.

The stdio protocol owns stdout. Runtime status and errors go to stderr.

## Canonical links

Rule responses point to:

```text
https://xanhast-pf.github.io/coding-bible/
```

Use `--canonical-url` to override that base for a fork or local deployment.

## Host references

The setup shapes above follow the host documentation for local stdio MCP servers:

- Claude Code: <https://docs.anthropic.com/en/docs/claude-code/mcp>
- Cursor: <https://cursor.com/docs/mcp>
- VS Code: <https://code.visualstudio.com/docs/agent-customization/mcp-servers>
