import type { CodingRule } from "../../types";
import { core001Rule } from "./CORE-001-optimize-for-understanding.ts";
import { core002Rule } from "./CORE-002-use-descriptive-names.ts";
import { core003Rule } from "./CORE-003-prefer-const.ts";
import { core004Rule } from "./CORE-004-comments-explain-why.ts";
import { core005Rule } from "./CORE-005-delete-dead-code.ts";
import { core006Rule } from "./CORE-006-name-meaningful-constants.ts";
import { core007Rule } from "./CORE-007-keep-cohesive-code-together.ts";
import { core008Rule } from "./CORE-008-reduce-nesting-when-it-improves-clarity.ts";
import { core009Rule } from "./CORE-009-preserve-non-obvious-context-during-refactors.ts";
import { core010Rule } from "./CORE-010-keep-the-public-surface-minimal.ts";
import { core011Rule } from "./CORE-011-hoist-context-free-helpers.ts";

export const coreRules = [
  core001Rule,
  core002Rule,
  core003Rule,
  core004Rule,
  core005Rule,
  core006Rule,
  core007Rule,
  core008Rule,
  core009Rule,
  core010Rule,
  core011Rule,
] satisfies readonly CodingRule[];
