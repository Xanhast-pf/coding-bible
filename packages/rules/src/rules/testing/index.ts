import type { CodingRule } from "../../types";
import { test001Rule } from "./TEST-001-test-observable-behavior.ts";
import { test002Rule } from "./TEST-002-test-realistic-states.ts";
import { test003Rule } from "./TEST-003-mock-the-boundary-not-its-implementation.ts";
import { test004Rule } from "./TEST-004-test-pure-logic-directly.ts";
import { test005Rule } from "./TEST-005-use-snapshots-selectively.ts";
import { test006Rule } from "./TEST-006-protect-fixed-bugs-with-regression-tests.ts";

export const testingRules = [
  test001Rule,
  test002Rule,
  test003Rule,
  test004Rule,
  test005Rule,
  test006Rule,
] satisfies readonly CodingRule[];
