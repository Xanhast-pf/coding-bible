import type { CodingRule } from "../../types";
import { legend001Rule } from "./LEGEND-001-use-usevalue-for-react-subscriptions.ts";
import { legend002Rule } from "./LEGEND-002-use-peek-only-when-non-reactive-access-is-intentional.ts";
import { legend003Rule } from "./LEGEND-003-update-observable-state-through-observable-apis.ts";
import { legend004Rule } from "./LEGEND-004-batch-sibling-updates-with-assign.ts";
import { legend005Rule } from "./LEGEND-005-subscribe-at-the-narrowest-useful-observable.ts";
import { legend006Rule } from "./LEGEND-006-keep-persisted-or-synchronized-state-serializable.ts";

export const legendStateRules = [
  legend001Rule,
  legend002Rule,
  legend003Rule,
  legend004Rule,
  legend005Rule,
  legend006Rule,
] satisfies readonly CodingRule[];
