import type { CodingRule } from "../../types";
import { perf001Rule } from "./PERF-001-optimize-where-scale-exists.ts";
import { perf002Rule } from "./PERF-002-measure-before-micro-optimizing.ts";
import { perf003Rule } from "./PERF-003-prefer-one-pass-on-hot-large-data-paths.ts";
import { perf004Rule } from "./PERF-004-choose-data-structures-for-access-patterns.ts";

export const performanceRules = [
  perf001Rule,
  perf002Rule,
  perf003Rule,
  perf004Rule,
] satisfies readonly CodingRule[];
