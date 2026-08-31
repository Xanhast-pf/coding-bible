# ADR-014: Browser analysis uses a virtual TypeScript project in a Web Worker

- Status: Accepted
- Date: 2026-08-29

## Context

ADR-009 introduced the browser analyzer as a source-local MVP. It intentionally
built a tiny TypeScript program with `noLib` and `noResolve`, which kept the first
version simple but left the public Analyze experience below the fidelity of the
CLI, MCP, and GitHub Action.

The analyzer has since become project-aware. Its canonical `analyzeProgram()` API
can run the same detectors against a real TypeScript `Program`, including shared
checker state and cross-file symbols. The static GitHub Pages site can use that
path without introducing a backend if project files are represented as an
in-memory filesystem.

Running a TypeScript compiler over many files can also consume noticeable CPU
and memory. That work must not block the React UI.

## Decision

Upgrade the browser Analyze experience around a disposable Web Worker and a
virtual TypeScript project.

1. **Keep one detector implementation.** Browser analysis builds a TypeScript
   `Program` and delegates findings to `@coding-bible/analyzer`'s existing
   `analyzeProgram()` API. The website does not maintain parallel detectors.
2. **Bundle TypeScript standard libraries.** Vite exposes the installed
   TypeScript `lib.*.d.ts` files to the worker as a generated virtual module.
   Snippet mode therefore has real standard-library symbols instead of `noLib`.
3. **Add local project mode.** Users can select a project folder. Supported
   source files, declaration files, JSON/package metadata, and local tsconfigs
   are read locally and mapped under an in-memory `/project` root.
4. **Mirror CLI project grouping.** Source files bind to their nearest canonical
   `tsconfig.json`, so monorepos can build multiple virtual TypeScript programs
   with the same project-boundary model as the CLI. Each config is parsed with
   the TypeScript compiler API, including local `extends` resolution. Browser-safe
   defaults fill missing options, while `noEmit` remains forced because analysis
   never writes build output.
5. **Honor browser-safe Coding Bible config.** Project mode loads a root
   `coding-bible.config.json` through the analyzer package's shared config
   validation, glob matching, rule enablement, severity, override, and `tsconfig`
   resolution logic. Executable config modules are detected but are never
   evaluated from a selected local folder; the UI reports that limitation instead
   of silently pretending the config was applied.
6. **Resolve from the virtual filesystem.** Relative modules, path aliases, local
   declarations, and package metadata present in the selected files can
   participate in TypeScript module resolution. Installed dependencies are not
   fetched from a registry and `node_modules` is skipped by default.
7. **Move heavy work off the main thread.** Each analysis run creates a Worker,
   reports coarse progress, and terminates after completion. Canceling a run
   terminates the worker immediately and releases its compiler state.
8. **Keep source private.** No source file, tsconfig, config, or analysis request is sent
   to Coding Bible or another service. The only network activity is loading the
   already-deployed static application assets.
9. **Manage browser resource use without an artificial hard cap.** Project
   selection ignores common generated and vendor directories. The former 2,500
   text-file / 32 MB thresholds are retained only as soft warnings; users can
   continue with larger workspaces. File contents are read with bounded
   concurrency, selection progress is visible and cancellable, and the analysis
   itself remains isolated in a disposable Worker. The practical ceiling is the
   memory available to the browser tab, not a Coding Bible rejection threshold.
10. **Export actionable artifacts locally.** Completed browser runs can download a
    versioned JSON report and separate safe/review patch files. Structured text
    edits and unified-diff generation live in `@coding-bible/analyzer`, so CLI
    and browser patch semantics cannot drift. Review-required edits are never
    mixed into the safe patch.

## Consequences

- Snippet mode gets higher-fidelity type information without becoming a project
  upload workflow.
- Project mode can reproduce much of the analyzer context available to the CLI
  while remaining a static GitHub Pages application.
- Browser results and CLI results share detector, config-resolution, and patch
  generation code, so new deterministic rules, JSON config behavior, and
  structured fixes benefit both surfaces automatically.
- The browser report intentionally identifies itself as a browser-runtime report.
  It does not claim CLI-only baseline/cache/profile metadata or stable baseline
  fingerprints.
- The analyzer worker is a larger lazy-loaded asset because it contains the
  TypeScript compiler and standard library declarations. The Learn page remains
  unaffected until Analyze is used.
- Projects that rely on type declarations available only from installed
  `node_modules` can still have less type context than the CLI. The UI must not
  claim exact parity in that case.
- Large-project CPU/memory cost is isolated from the UI thread, but users may
  still observe temporary system load while TypeScript builds the virtual
  program.
