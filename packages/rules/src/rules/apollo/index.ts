import type { CodingRule } from "../../types";
import { apollo001Rule } from "./APOLLO-001-define-stable-cache-identity.ts";
import { apollo002Rule } from "./APOLLO-002-choose-fetch-policies-deliberately.ts";
import { apollo003Rule } from "./APOLLO-003-return-modified-entities-from-mutations.ts";
import { apollo004Rule } from "./APOLLO-004-reconcile-mutation-results-explicitly.ts";
import { apollo005Rule } from "./APOLLO-005-encode-pagination-and-merge-semantics-in-field-policies.ts";
import { apollo006Rule } from "./APOLLO-006-handle-graphql-errors-and-partial-data-intentionally.ts";

export const apolloRules = [
  apollo001Rule,
  apollo002Rule,
  apollo003Rule,
  apollo004Rule,
  apollo005Rule,
  apollo006Rule,
] satisfies readonly CodingRule[];
