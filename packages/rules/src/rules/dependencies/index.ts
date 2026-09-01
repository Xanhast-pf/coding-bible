import type { CodingRule } from "../../types";
import { dep001Rule } from "./DEP-001-prefer-the-platform-before-a-dependency.ts";
import { dep002Rule } from "./DEP-002-justify-runtime-dependencies.ts";
import { dep003Rule } from "./DEP-003-remove-unused-dependencies.ts";
import { dep004Rule } from "./DEP-004-avoid-duplicate-solutions.ts";

export const dependencyRules = [
  dep001Rule,
  dep002Rule,
  dep003Rule,
  dep004Rule,
] satisfies readonly CodingRule[];
