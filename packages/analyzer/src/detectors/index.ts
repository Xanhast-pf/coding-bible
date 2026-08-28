import type { Detector } from "../types.ts";
import {
  accessibleControlNameDetector,
  keyboardInteractionDetector,
  semanticInteractiveElementDetector,
} from "./accessibilityJsx.ts";
import { directComponentCallsDetector } from "./directComponentCalls.ts";
import { graphqlInterpolationDetector } from "./graphqlTemplates.ts";
import { hookDependencySuppressionsDetector } from "./hookDependencySuppressions.ts";
import {
  defaultParameterDetector,
  nonMutatingCollectionDetector,
  optionalChainingDetector,
} from "./javascriptPatterns.ts";
import { legacyBuiltinsDetector } from "./legacyBuiltins.ts";
import { legendReactSubscriptionDetector } from "./legendReactSubscriptions.ts";
import { noExplicitAnyDetector } from "./noExplicitAny.ts";
import { preferConstDetector } from "./preferConst.ts";
import {
  reactInputMutationDetector,
  staticComponentValueDetector,
} from "./reactRenderPatterns.ts";
import {
  missingReactListKeyDetector,
  unstableReactListKeyDetector,
} from "./reactListKeys.ts";
import { reactHookPlacementDetector } from "./reactHooks.ts";
import { typeOnlyImportsDetector } from "./typeOnlyImports.ts";
import { untrustedAssertionsDetector } from "./untrustedAssertions.ts";

export const detectors = [
  preferConstDetector,
  noExplicitAnyDetector,
  typeOnlyImportsDetector,
  untrustedAssertionsDetector,
  optionalChainingDetector,
  defaultParameterDetector,
  legacyBuiltinsDetector,
  nonMutatingCollectionDetector,
  semanticInteractiveElementDetector,
  keyboardInteractionDetector,
  accessibleControlNameDetector,
  graphqlInterpolationDetector,
  legendReactSubscriptionDetector,
  missingReactListKeyDetector,
  unstableReactListKeyDetector,
  staticComponentValueDetector,
  reactHookPlacementDetector,
  directComponentCallsDetector,
  reactInputMutationDetector,
  hookDependencySuppressionsDetector,
] satisfies readonly Detector[];
