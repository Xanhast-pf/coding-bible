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

## MVP checks

The first pass covers violations that can be identified from one pasted
TypeScript/JavaScript file with high confidence:

- `TS-001` explicit `any`
- `TS-003` value imports used only in type positions
- `TS-004` assertions directly over external runtime reads
- `JS-004` legacy global/prototype built-ins
- `REACT-006` missing list keys
- `REACT-006` unstable index/generated list keys
- `REACT-009` invalid Hook placement
- `REACT-010` direct invocation of local React components
- `REACT-012` exhaustive-deps suppressions

The package intentionally does not guess at architecture, naming quality,
business logic, or other rules that require repository or human context.
