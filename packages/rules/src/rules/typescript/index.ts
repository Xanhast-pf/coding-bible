import type { CodingRule } from "../../types";
import { ts001Rule } from "./TS-001-avoid-any.ts";
import { ts002Rule } from "./TS-002-keep-types-narrow.ts";
import { ts003Rule } from "./TS-003-use-type-only-imports.ts";
import { ts004Rule } from "./TS-004-treat-untrusted-input-as-unknown.ts";
import { ts005Rule } from "./TS-005-optional-means-genuinely-optional.ts";
import { ts006Rule } from "./TS-006-model-variants-as-discriminated-unions.ts";
import { ts007Rule } from "./TS-007-do-not-cast-to-silence-the-compiler.ts";

export const typescriptRules = [
  ts001Rule,
  ts002Rule,
  ts003Rule,
  ts004Rule,
  ts005Rule,
  ts006Rule,
  ts007Rule,
] satisfies readonly CodingRule[];
