import type { CodingRule } from "../../types";
import { next001Rule } from "./NEXT-001-default-to-server-components.ts";
import { next002Rule } from "./NEXT-002-keep-use-client-boundaries-as-small-as-practical.ts";
import { next003Rule } from "./NEXT-003-pass-serializable-props-across-the-server-client-boundary.ts";
import { next004Rule } from "./NEXT-004-protect-server-only-code-from-client-imports.ts";
import { next005Rule } from "./NEXT-005-fetch-server-data-directly-from-server-components.ts";
import { next006Rule } from "./NEXT-006-avoid-avoidable-data-fetching-waterfalls.ts";

export const nextjsRules = [
  next001Rule,
  next002Rule,
  next003Rule,
  next004Rule,
  next005Rule,
  next006Rule,
] satisfies readonly CodingRule[];
