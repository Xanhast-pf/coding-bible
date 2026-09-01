import type { Detector } from "../types.ts";
import {
  accessibleControlNameDetector,
  keyboardInteractionDetector,
  semanticInteractiveElementDetector,
} from "./accessibilityJsx.ts";
import { redundantAsyncDetector } from "./asyncFunctions.ts";
import { directComponentCallsDetector } from "./directComponentCalls.ts";
import { derivedStateEffectDetector } from "./derivedStateEffects.ts";
import { graphqlInterpolationDetector } from "./graphqlTemplates.ts";
import { hardcodedJsxTextDetector } from "./hardcodedJsxText.ts";
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
import { unsafeUnknownAssertionDetector } from "./unsafeTypeAssertions.ts";

export const detectors = [
  preferConstDetector,
  redundantAsyncDetector,
  noExplicitAnyDetector,
  typeOnlyImportsDetector,
  untrustedAssertionsDetector,
  unsafeUnknownAssertionDetector,
  optionalChainingDetector,
  defaultParameterDetector,
  legacyBuiltinsDetector,
  nonMutatingCollectionDetector,
  semanticInteractiveElementDetector,
  keyboardInteractionDetector,
  accessibleControlNameDetector,
  graphqlInterpolationDetector,
  hardcodedJsxTextDetector,
  legendReactSubscriptionDetector,
  missingReactListKeyDetector,
  unstableReactListKeyDetector,
  staticComponentValueDetector,
  reactHookPlacementDetector,
  directComponentCallsDetector,
  derivedStateEffectDetector,
  reactInputMutationDetector,
  hookDependencySuppressionsDetector,
] satisfies readonly Detector[];

const hashDetectorContract = (value: string) => {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
};

const detectorContract = detectors
  .map(
    ({ dependencyScope, id, languages, ruleId }) =>
      `${id}:${ruleId}:${dependencyScope}:${languages?.join(",") ?? "*"}`,
  )
  .join("|");

export const analyzerDetectorCount = detectors.length;
export const analyzerDetectorSignature = `detectors-v1-${hashDetectorContract(detectorContract)}`;
