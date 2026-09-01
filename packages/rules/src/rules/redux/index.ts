import type { CodingRule } from "../../types";
import { redux001Rule } from "./REDUX-001-use-redux-toolkit-for-modern-redux.ts";
import { redux002Rule } from "./REDUX-002-keep-reducers-pure.ts";
import { redux003Rule } from "./REDUX-003-keep-redux-state-and-normal-actions-serializable.ts";
import { redux004Rule } from "./REDUX-004-keep-redux-state-minimal-and-derive-the-rest.ts";
import { redux005Rule } from "./REDUX-005-normalize-complex-relational-collections.ts";
import { redux006Rule } from "./REDUX-006-use-selectors-to-encapsulate-state-shape.ts";
import { redux007Rule } from "./REDUX-007-memoize-selectors-only-when-they-derive-expensive-or-referentially-new-values.ts";
import { redux008Rule } from "./REDUX-008-keep-transient-ui-and-form-state-local-by-default.ts";
import { redux009Rule } from "./REDUX-009-use-one-redux-store-per-application.ts";
import { redux010Rule } from "./REDUX-010-organize-redux-logic-by-feature.ts";
import { redux011Rule } from "./REDUX-011-prefer-rtk-query-for-server-data-in-redux-applications.ts";

export const reduxRules = [
  redux001Rule,
  redux002Rule,
  redux003Rule,
  redux004Rule,
  redux005Rule,
  redux006Rule,
  redux007Rule,
  redux008Rule,
  redux009Rule,
  redux010Rule,
  redux011Rule,
] satisfies readonly CodingRule[];
