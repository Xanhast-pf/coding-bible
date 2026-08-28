# Source Distillation Policy

Coding Bible can learn from project-specific review standards without treating
every local convention as universal engineering law.

## Promote a source rule when

- it prevents a real correctness, accessibility, maintainability, architecture,
  security, or performance problem;
- its rationale survives outside the source repository;
- its severity can be defended without relying on local lint configuration;
- valid exceptions can be stated honestly.

## Keep it project-specific when

- the rule exists mainly for local consistency;
- it depends on one repository's aliases, logger, component library, state shape,
  branch model, or generated files;
- another reasonable ecosystem intentionally uses a different model.

Examples intentionally *not* promoted as universal laws:

- every function must use arrow syntax;
- every import must be absolute;
- every list/object key must be alphabetically sorted;
- `forEach` is always forbidden;
- null checks must use Lodash `isNil`;
- every `switch` case must be alphabetized;
- every React callback prop must be manually memoized.

Those can still be excellent repository conventions. Coding Bible reserves its
universal and framework packs for rules with a stronger technical contract.
