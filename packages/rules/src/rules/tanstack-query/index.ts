import type { CodingRule } from "../../types";
import { tq001Rule } from "./TQ-001-put-every-query-dependency-in-the-query-key.ts";
import { tq002Rule } from "./TQ-002-keep-query-keys-serializable-and-deterministic.ts";
import { tq003Rule } from "./TQ-003-configure-freshness-instead-of-fighting-refetch-behavior.ts";
import { tq004Rule } from "./TQ-004-invalidate-related-queries-after-successful-mutations.ts";
import { tq005Rule } from "./TQ-005-make-query-functions-reject-failed-requests.ts";

export const tanstackQueryRules = [
  tq001Rule,
  tq002Rule,
  tq003Rule,
  tq004Rule,
  tq005Rule,
] satisfies readonly CodingRule[];
