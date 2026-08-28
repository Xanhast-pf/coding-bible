import type { Detector } from "../types.ts";
import { directComponentCallsDetector } from "./directComponentCalls.ts";
import { hookDependencySuppressionsDetector } from "./hookDependencySuppressions.ts";
import { legacyBuiltinsDetector } from "./legacyBuiltins.ts";
import { noExplicitAnyDetector } from "./noExplicitAny.ts";
import {
  missingReactListKeyDetector,
  unstableReactListKeyDetector,
} from "./reactListKeys.ts";
import { reactHookPlacementDetector } from "./reactHooks.ts";
import { typeOnlyImportsDetector } from "./typeOnlyImports.ts";
import { untrustedAssertionsDetector } from "./untrustedAssertions.ts";

export const detectors = [
  noExplicitAnyDetector,
  typeOnlyImportsDetector,
  untrustedAssertionsDetector,
  legacyBuiltinsDetector,
  missingReactListKeyDetector,
  unstableReactListKeyDetector,
  reactHookPlacementDetector,
  directComponentCallsDetector,
  hookDependencySuppressionsDetector,
] satisfies readonly Detector[];
