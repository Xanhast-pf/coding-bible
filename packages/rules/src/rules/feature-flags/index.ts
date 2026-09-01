import type { CodingRule } from "../../types";
import { flag001Rule } from "./FLAG-001-every-feature-flag-needs-a-removal-plan.ts";
import { flag002Rule } from "./FLAG-002-delete-flags-after-rollout.ts";
import { flag003Rule } from "./FLAG-003-keep-flag-decisions-at-clear-boundaries.ts";
import { flag004Rule } from "./FLAG-004-test-both-reachable-flag-states.ts";

export const featureFlagRules = [
  flag001Rule,
  flag002Rule,
  flag003Rule,
  flag004Rule,
] satisfies readonly CodingRule[];
