# @coding-bible/analyzer

Deterministic, source-local checks for Coding Bible rules.

The analyzer is deliberately UI-free. It accepts a source string and language,
parses it with the TypeScript compiler API, and returns structured findings with
rule IDs and source locations.

```ts
import { analyze } from "@coding-bible/analyzer";

const result = analyze({
  language: "tsx",
  source,
});
```

## Automated coverage

The current pass runs 20 detector functions covering 19 Bible rules that can be
identified from one TypeScript, TSX, JavaScript, or JSX source file without
repository-wide context:

- `CORE-003` bindings that can be `const`
- `JS-002` repeated nullish guard chains suited to optional chaining
- `JS-003` body-level undefined defaults suited to default parameters
- `JS-004` legacy global/prototype built-ins
- `JS-006` mutating sort/reverse results stored as separate values
- `TS-001` explicit `any`
- `TS-003` value imports used only in type positions
- `TS-004` assertions directly over external runtime reads
- `A11Y-001` clickable generic elements without native semantics
- `A11Y-002` custom buttons without equivalent keyboard handling
- `A11Y-004` buttons without a detectable accessible name
- `GQL-002` runtime interpolation inside `gql`/`graphql` templates
- `LEGEND-001` Legend-State `get()` subscriptions inside `observer` renders
- `REACT-006` missing list keys
- `REACT-006` unstable index/generated list keys
- `REACT-008` context-free array/object allocations inside components
- `REACT-009` invalid Hook placement
- `REACT-010` direct invocation of local React components
- `REACT-011` mutation of values received through component inputs
- `REACT-012` exhaustive-deps suppressions

`AnalyzeResult.ruleIdsChecked` reports the exact automated rule set used for a
run. A clean result therefore means "clean for the automated subset," not
"clean for all Coding Bible rules."

Every automated rule is contract-tested against the rule registry: its exact
DON'T example must produce that rule, and its exact DO example must not produce
that rule. Detector-specific regression tests cover additional positive and
negative cases.

The package intentionally does not guess at architecture, naming quality,
business logic, or other rules that require repository or human context.
