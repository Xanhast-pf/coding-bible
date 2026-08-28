# ADR-006: Code examples use lightweight local highlighting

- Status: Accepted
- Date: 2026-08-28

## Context

Coding Bible displays many short TypeScript, TSX, and CSS examples. Syntax
highlighting materially improves scanability, but a full highlighting package
would add runtime and maintenance cost for a deliberately small requirement.

## Decision

- Use a small presentation-only tokenizer owned by `CodeSnippet`.
- Render tokens as React nodes; do not use `dangerouslySetInnerHTML`.
- Keep the tokenizer intentionally shallow. It is not a parser or analyzer.
- Syntax accuracy may be approximate as long as code content is preserved exactly.
- Reconsider a dedicated highlighter only if language coverage or correctness
  requirements materially outgrow this implementation.

## Consequences

- No syntax-highlighting runtime dependency.
- Examples gain line numbers and semantic editor-style colors.
- The highlighter remains easy to replace later.
- We explicitly avoid pretending the tokenizer understands code semantics.
