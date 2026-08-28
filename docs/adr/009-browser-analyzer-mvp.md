# ADR-009: Browser analyzer MVP uses the TypeScript AST

- Status: Accepted
- Date: 2026-08-28

## Context

The rule registry already describes which standards are mechanically detectable,
but the public site only teaches rules. The next useful consumer is a paste-in
reviewer that can connect a concrete source location to the rule that explains
it.

Regex-based detection would be cheap to build but would misclassify syntax,
comments, shadowed names, JSX, and nested control flow. A first analyzer also
needs to remain reusable by a future CLI rather than embedding checks inside
React components.

## Decision

Create `@coding-bible/analyzer` as a UI-free workspace package.

The analyzer:

1. parses TypeScript, TSX, JavaScript, and JSX with the TypeScript compiler API;
2. runs small independent detectors over the resulting AST;
3. returns structured findings with rule IDs and source locations;
4. limits the MVP to source-local checks with high-confidence evidence; and
5. does not make network requests or require a backend.

The website exposes the analyzer through an `Analyze` mode. The analyzer package
is dynamically imported only after the user asks to analyze code, keeping the
compiler out of the initial Learn-page bundle.

The first release intentionally does not attempt repository-level checks,
auto-fixes, semantic type-checker analysis, or AI review.

## Consequences

- Findings are explainable: each result points to syntax and a canonical rule.
- The same engine can later power a CLI and CI without depending on React.
- The Learn experience does not pay the TypeScript compiler download cost unless
  Analyze is used.
- Some rules remain explicitly human-review-only until stronger context exists.
- TypeScript becomes a runtime dependency of the analyzer package because the
  parser executes in the browser.
