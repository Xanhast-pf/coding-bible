import type { CodingRule } from "../../types";
import { work001Rule } from "./WORK-001-run-the-relevant-checks-before-merge.ts";
import { work002Rule } from "./WORK-002-keep-changes-scoped.ts";
import { work003Rule } from "./WORK-003-verify-usage-before-deleting-code.ts";
import { work004Rule } from "./WORK-004-call-out-deferred-or-dependent-work.ts";

export const workflowRules = [
  work001Rule,
  work002Rule,
  work003Rule,
  work004Rule,
] satisfies readonly CodingRule[];
