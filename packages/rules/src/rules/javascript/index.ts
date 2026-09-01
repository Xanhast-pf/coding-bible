import type { CodingRule } from "../../types";
import { js001Rule } from "./JS-001-use-async-only-for-promise-semantics.ts";
import { js002Rule } from "./JS-002-use-optional-chaining-for-genuine-nullish-access.ts";
import { js003Rule } from "./JS-003-prefer-default-parameters-for-default-inputs.ts";
import { js004Rule } from "./JS-004-prefer-namespace-safe-built-ins.ts";
import { js005Rule } from "./JS-005-scope-try-catch-to-the-operation-that-can-fail.ts";
import { js006Rule } from "./JS-006-prefer-non-mutating-collection-apis-when-mutation-is-not-intended.ts";
import { js007Rule } from "./JS-007-use-an-options-object-when-positional-parameters-stop-being-obvious.ts";

export const javascriptRules = [
  js001Rule,
  js002Rule,
  js003Rule,
  js004Rule,
  js005Rule,
  js006Rule,
  js007Rule,
] satisfies readonly CodingRule[];
