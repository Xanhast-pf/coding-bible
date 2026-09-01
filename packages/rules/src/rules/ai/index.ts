import type { CodingRule } from "../../types";
import { ai001Rule } from "./AI-001-generated-code-follows-existing-architecture.ts";
import { ai002Rule } from "./AI-002-generated-comments-must-add-context.ts";
import { ai003Rule } from "./AI-003-change-the-smallest-coherent-surface.ts";
import { ai004Rule } from "./AI-004-inspect-before-creating.ts";
import { ai005Rule } from "./AI-005-verify-external-apis.ts";
import { ai006Rule } from "./AI-006-do-not-invent-impossible-edge-cases.ts";
import { ai007Rule } from "./AI-007-run-the-project-s-checks.ts";

export const aiRules = [
  ai001Rule,
  ai002Rule,
  ai003Rule,
  ai004Rule,
  ai005Rule,
  ai006Rule,
  ai007Rule,
] satisfies readonly CodingRule[];
