import type { CodingRule } from "../../types";
import { arch001Rule } from "./ARCH-001-separate-responsibilities.ts";
import { arch002Rule } from "./ARCH-002-keep-dependencies-explicit.ts";
import { arch003Rule } from "./ARCH-003-abstract-after-understanding-repetition.ts";
import { arch004Rule } from "./ARCH-004-keep-side-effects-at-boundaries.ts";
import { arch005Rule } from "./ARCH-005-keep-one-source-of-truth.ts";
import { arch006Rule } from "./ARCH-006-do-not-add-pass-through-abstractions.ts";
import { arch007Rule } from "./ARCH-007-organize-around-cohesive-domains.ts";

export const architectureRules = [
  arch001Rule,
  arch002Rule,
  arch003Rule,
  arch004Rule,
  arch005Rule,
  arch006Rule,
  arch007Rule,
] satisfies readonly CodingRule[];
