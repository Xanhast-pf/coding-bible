# Analyzer automation matrix

This matrix classifies every stable Coding Bible rule by the level of automation
the analyzer can responsibly claim today. It is generated from
`docs/analyzer-automation-policy.json` and the canonical rule catalog.

> Automate only what static evidence can defend; breadth must never be purchased with false-positive noise.

## Coverage summary

| Classification | Rules |
| --- | ---: |
| Automated | 27 |
| High-confidence candidate | 12 |
| Contextual candidate | 42 |
| Human / agent review | 43 |
| External tool | 4 |
| **Total** | **128** |

A rule marked **Automated** has a detector in the shared analyzer and must pass
the independent Canary promotion contract. A **High-confidence candidate** is
next in line for Canary-first detector development. A **Contextual candidate**
may be worth surfacing, but only after its uncertainty can be expressed honestly.
**Human / agent review** rules intentionally remain judgment calls.
**External tool** rules are primarily owned by tools such as TypeScript, Knip,
GraphQL validators, or CI.

## Next high-confidence candidates

| Priority | Rule | Pack | Blocker / required evidence |
| ---: | --- | --- | --- |
| 1 | `NEXT-004` — Protect server-only code from client imports | `nextjs` | Needs project import-graph analysis for client-to-server-only leakage. |
| 2 | `GQL-001` — Name production operations | `graphql` | Needs standalone GraphQL source support or a clearly documented embedded-document-only contract. |
| 3 | `NEXT-003` — Pass serializable props across the server-client boundary | `nextjs` | Needs project-aware Server/Client Component boundary resolution and prop-value serializability. |
| 4 | `TQ-005` — Make query functions reject failed requests | `tanstack-query` | Needs query-function identity tracing so fetch response checks are enforced only for actual query functions. |
| 5 | `TQ-002` — Keep query keys serializable and deterministic | `tanstack-query` | Needs query-key AST/value analysis for unstable or non-serializable identity. |
| 6 | `LEGEND-003` — Update observable state through observable APIs | `legend-state` | Needs Legend observable symbol identity and mutation-flow checks around peek()/set(). |
| 7 | `REDUX-001` — Use Redux Toolkit for modern Redux | `redux` | Needs precise Redux identity/legacy-pattern detection without treating every reducer switch as Redux. |
| 8 | `A11Y-003` — Keep focus visible | `accessibility` | Needs style/CSS evidence that focus indicators are not removed without an equivalent visible replacement. |
| 9 | `REDUX-003` — Keep Redux state and normal actions serializable | `redux` | Needs Redux state/action boundary identification plus conservative serializability checks. |
| 10 | `NEXT-005` — Fetch server data directly from Server Components | `nextjs` | Needs Server Component identification plus conservative same-app HTTP indirection detection. |
| 11 | `A11Y-006` — Respect reduced motion preferences | `accessibility` | Needs style/CSS animation evidence plus reduced-motion handling. |
| 12 | `LEGEND-006` — Keep persisted or synchronized state serializable | `legend-state` | Needs persistence/sync API identity plus conservative serializability analysis. |

## Full matrix

| Rule | Title | Pack | Classification | Priority | Blocker / rationale |
| --- | --- | --- | --- | ---: | --- |
| `A11Y-001` | Prefer semantic HTML | `accessibility` | Automated | 100 | — |
| `A11Y-002` | Keyboard access is mandatory | `accessibility` | Automated | 100 | — |
| `A11Y-004` | Controls need accessible names | `accessibility` | Automated | 100 | — |
| `CORE-003` | Prefer const | `core` | Automated | 100 | — |
| `GQL-002` | Pass dynamic values as variables | `graphql` | Automated | 100 | — |
| `I18N-001` | Localize user-visible text | `internationalization` | Automated | 100 | — |
| `I18N-003` | Use Intl for locale-sensitive formatting | `internationalization` | Automated | 100 | — |
| `JS-001` | Use async only for Promise semantics | `javascript` | Automated | 100 | — |
| `JS-002` | Use optional chaining for genuine nullish access | `javascript` | Automated | 100 | — |
| `JS-003` | Prefer default parameters for default inputs | `javascript` | Automated | 100 | — |
| `JS-004` | Prefer namespace-safe built-ins | `javascript` | Automated | 100 | — |
| `JS-006` | Prefer non-mutating collection APIs when mutation is not intended | `javascript` | Automated | 100 | — |
| `LEGEND-001` | Use useValue for React subscriptions | `legend-state` | Automated | 100 | — |
| `LEGEND-004` | Batch sibling updates with assign | `legend-state` | Automated | 100 | — |
| `REACT-004` | Do not store derived state | `react` | Automated | 100 | — |
| `REACT-006` | Use stable list keys | `react` | Automated | 100 | — |
| `REACT-008` | Move static values out of components | `react` | Automated | 100 | — |
| `REACT-009` | Follow the Rules of Hooks | `react` | Automated | 100 | — |
| `REACT-010` | Let React call components | `react` | Automated | 100 | — |
| `REACT-011` | Treat props, state, and Hook inputs as immutable snapshots | `react` | Automated | 100 | — |
| `REACT-012` | Do not suppress Hook dependency correctness | `react` | Automated | 100 | — |
| `REDUX-009` | Use one Redux store per application | `redux` | Automated | 100 | — |
| `TQ-001` | Put every query dependency in the query key | `tanstack-query` | Automated | 100 | — |
| `TS-001` | Avoid any | `typescript` | Automated | 100 | — |
| `TS-003` | Use type-only imports | `typescript` | Automated | 100 | — |
| `TS-004` | Treat untrusted input as unknown | `typescript` | Automated | 100 | — |
| `TS-007` | Do not cast to silence the compiler | `typescript` | Automated | 100 | — |
| `NEXT-004` | Protect server-only code from client imports | `nextjs` | High-confidence candidate | 93 | Needs project import-graph analysis for client-to-server-only leakage. |
| `GQL-001` | Name production operations | `graphql` | High-confidence candidate | 92 | Needs standalone GraphQL source support or a clearly documented embedded-document-only contract. |
| `NEXT-003` | Pass serializable props across the server-client boundary | `nextjs` | High-confidence candidate | 91 | Needs project-aware Server/Client Component boundary resolution and prop-value serializability. |
| `TQ-005` | Make query functions reject failed requests | `tanstack-query` | High-confidence candidate | 90 | Needs query-function identity tracing so fetch response checks are enforced only for actual query functions. |
| `TQ-002` | Keep query keys serializable and deterministic | `tanstack-query` | High-confidence candidate | 89 | Needs query-key AST/value analysis for unstable or non-serializable identity. |
| `LEGEND-003` | Update observable state through observable APIs | `legend-state` | High-confidence candidate | 88 | Needs Legend observable symbol identity and mutation-flow checks around peek()/set(). |
| `REDUX-001` | Use Redux Toolkit for modern Redux | `redux` | High-confidence candidate | 86 | Needs precise Redux identity/legacy-pattern detection without treating every reducer switch as Redux. |
| `A11Y-003` | Keep focus visible | `accessibility` | High-confidence candidate | 84 | Needs style/CSS evidence that focus indicators are not removed without an equivalent visible replacement. |
| `REDUX-003` | Keep Redux state and normal actions serializable | `redux` | High-confidence candidate | 84 | Needs Redux state/action boundary identification plus conservative serializability checks. |
| `NEXT-005` | Fetch server data directly from Server Components | `nextjs` | High-confidence candidate | 83 | Needs Server Component identification plus conservative same-app HTTP indirection detection. |
| `A11Y-006` | Respect reduced motion preferences | `accessibility` | High-confidence candidate | 82 | Needs style/CSS animation evidence plus reduced-motion handling. |
| `LEGEND-006` | Keep persisted or synchronized state serializable | `legend-state` | High-confidence candidate | 80 | Needs persistence/sync API identity plus conservative serializability analysis. |
| `A11Y-005` | Do not communicate with color alone | `accessibility` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `APOLLO-001` | Define stable cache identity | `apollo` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `APOLLO-004` | Reconcile mutation results explicitly | `apollo` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `APOLLO-006` | Handle GraphQL errors and partial data intentionally | `apollo` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `FLAG-002` | Delete flags after rollout | `feature-flags` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `FLAG-004` | Test both reachable flag states | `feature-flags` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `GQL-005` | Treat nullability as part of the contract | `graphql` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `GQL-006` | Paginate collections that can grow without bound | `graphql` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `I18N-002` | Parameterize messages instead of concatenating sentences | `internationalization` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `LEGEND-002` | Use peek only when non-reactive access is intentional | `legend-state` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `REACT-007` | Keep render pure | `react` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `REDUX-002` | Keep reducers pure | `redux` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `REDUX-004` | Keep Redux state minimal and derive the rest | `redux` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `TQ-004` | Invalidate related queries after successful mutations | `tanstack-query` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `TS-002` | Keep types narrow | `typescript` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `TS-005` | Optional means genuinely optional | `typescript` | Contextual candidate | 68 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `CORE-010` | Keep the public surface minimal | `core` | Contextual candidate | 63 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `APOLLO-002` | Choose fetch policies deliberately | `apollo` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `APOLLO-003` | Return modified entities from mutations | `apollo` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `APOLLO-005` | Encode pagination and merge semantics in field policies | `apollo` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `CORE-006` | Name meaningful constants | `core` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `FLAG-003` | Keep flag decisions at clear boundaries | `feature-flags` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `GQL-003` | Use fragments for genuinely shared selection sets | `graphql` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `I18N-004` | Design layouts for text expansion and direction | `internationalization` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `JS-005` | Scope try/catch to the operation that can fail | `javascript` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `LEGEND-005` | Subscribe at the narrowest useful observable | `legend-state` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `NEXT-001` | Default to Server Components | `nextjs` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `NEXT-002` | Keep use client boundaries as small as practical | `nextjs` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `NEXT-006` | Avoid avoidable data-fetching waterfalls | `nextjs` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `REACT-005` | Use effects to synchronize external systems | `react` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `REDUX-005` | Normalize complex relational collections | `redux` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `REDUX-006` | Use selectors to encapsulate state shape | `redux` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `REDUX-011` | Prefer RTK Query for server data in Redux applications | `redux` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `TQ-003` | Configure freshness instead of fighting refetch behavior | `tanstack-query` | Contextual candidate | 56 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `CORE-011` | Hoist context-free helpers | `core` | Contextual candidate | 51 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `CORE-008` | Reduce nesting when it improves clarity | `core` | Contextual candidate | 44 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `JS-007` | Use an options object when positional parameters stop being obvious | `javascript` | Contextual candidate | 44 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `PERF-003` | Prefer one pass on hot large-data paths | `performance` | Contextual candidate | 44 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `REACT-002` | Do not memoize by reflex | `react` | Contextual candidate | 44 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `REDUX-007` | Memoize selectors only when they derive expensive or referentially new values | `redux` | Contextual candidate | 44 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `TEST-005` | Use snapshots selectively | `testing` | Contextual candidate | 44 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `TS-006` | Model variants as discriminated unions | `typescript` | Contextual candidate | 44 | Static evidence can likely surface useful signals, but the conclusion needs context or a tighter detector contract before promotion. |
| `AI-001` | Generated code follows existing architecture | `ai` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `AI-002` | Generated comments must add context | `ai` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `AI-003` | Change the smallest coherent surface | `ai` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `AI-004` | Inspect before creating | `ai` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `AI-005` | Verify external APIs | `ai` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `AI-006` | Do not invent impossible edge cases | `ai` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `AI-007` | Run the project's checks | `ai` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `ARCH-001` | Separate responsibilities | `architecture` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `ARCH-002` | Keep dependencies explicit | `architecture` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `ARCH-003` | Abstract after understanding repetition | `architecture` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `ARCH-004` | Keep side effects at boundaries | `architecture` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `ARCH-005` | Keep one source of truth | `architecture` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `ARCH-006` | Do not add pass-through abstractions | `architecture` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `ARCH-007` | Organize around cohesive domains | `architecture` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `CORE-001` | Optimize for understanding | `core` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `CORE-002` | Use descriptive names | `core` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `CORE-004` | Comments explain why | `core` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `CORE-007` | Keep cohesive code together | `core` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `CORE-009` | Preserve non-obvious context during refactors | `core` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `CSS-001` | Name styles by role, not appearance | `css` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `CSS-002` | Use tokens for shared visual decisions | `css` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `CSS-003` | Prefer layout systems over manual nudges | `css` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `CSS-004` | Keep component styles scoped | `css` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `DEP-001` | Prefer the platform before a dependency | `dependencies` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `DEP-002` | Justify runtime dependencies | `dependencies` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `DEP-004` | Avoid duplicate solutions | `dependencies` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `FLAG-001` | Every feature flag needs a removal plan | `feature-flags` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `PERF-001` | Optimize where scale exists | `performance` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `PERF-002` | Measure before micro-optimizing | `performance` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `PERF-004` | Choose data structures for access patterns | `performance` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `REACT-001` | Keep components focused on presentation | `react` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `REACT-003` | Keep state as local as practical | `react` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `REACT-013` | Extract coherent React responsibilities, not arbitrary line counts | `react` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `REDUX-008` | Keep transient UI and form state local by default | `redux` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `REDUX-010` | Organize Redux logic by feature | `redux` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `TEST-001` | Test observable behavior | `testing` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `TEST-002` | Test realistic states | `testing` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `TEST-003` | Mock the boundary, not its implementation | `testing` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `TEST-004` | Test pure logic directly | `testing` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `TEST-006` | Protect fixed bugs with regression tests | `testing` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `WORK-002` | Keep changes scoped | `workflow` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `WORK-003` | Verify usage before deleting code | `workflow` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `WORK-004` | Call out deferred or dependent work | `workflow` | Human / agent review | 20 | Requires engineering intent, architecture, product context, or review history that static analysis should not guess. |
| `CORE-005` | Delete dead code | `core` | External tool | 0 | Dead-code ownership is primarily TypeScript/ESLint/Knip; Coding Bible should consume or contextualize those signals rather than duplicate them. |
| `DEP-003` | Remove unused dependencies | `dependencies` | External tool | 0 | Unused dependency detection is already owned well by Knip/package tooling. |
| `GQL-004` | Validate operations against the schema | `graphql` | External tool | 0 | Schema validation is best delegated to GraphQL validation/codegen/lint tooling with the actual schema. |
| `WORK-001` | Run the relevant checks before merge | `workflow` | External tool | 0 | Whether checks ran is a CI/workflow fact, not a source-code detector responsibility. |

## Promotion rule

Detector development is Canary-first:

1. Add independent violating, valid, adversarial, and contextual cases.
2. Mark the rule as a candidate in Canary.
3. Implement the narrowest defensible detector.
4. Run the Coding Bible repository gate.
5. Run the external Canary torture suite against the exact candidate SHA.
6. Promote the rule to **Automated** only when the candidate and all required
   consumers pass.

Automated coverage is a trust claim, not a progress counter.
