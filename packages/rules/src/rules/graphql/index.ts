import type { CodingRule } from "../../types";
import { gql001Rule } from "./GQL-001-name-production-operations.ts";
import { gql002Rule } from "./GQL-002-pass-dynamic-values-as-variables.ts";
import { gql003Rule } from "./GQL-003-use-fragments-for-genuinely-shared-selection-sets.ts";
import { gql004Rule } from "./GQL-004-validate-operations-against-the-schema.ts";
import { gql005Rule } from "./GQL-005-treat-nullability-as-part-of-the-contract.ts";
import { gql006Rule } from "./GQL-006-paginate-collections-that-can-grow-without-bound.ts";

export const graphqlRules = [
  gql001Rule,
  gql002Rule,
  gql003Rule,
  gql004Rule,
  gql005Rule,
  gql006Rule,
] satisfies readonly CodingRule[];
