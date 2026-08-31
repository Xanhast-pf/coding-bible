import { accessibleControlNameDetector, keyboardInteractionDetector, semanticInteractiveElementDetector, } from "./accessibilityJsx.mjs";
import { directComponentCallsDetector } from "./directComponentCalls.mjs";
import { derivedStateEffectDetector } from "./derivedStateEffects.mjs";
import { graphqlInterpolationDetector } from "./graphqlTemplates.mjs";
import { hookDependencySuppressionsDetector } from "./hookDependencySuppressions.mjs";
import { defaultParameterDetector, nonMutatingCollectionDetector, optionalChainingDetector, } from "./javascriptPatterns.mjs";
import { legacyBuiltinsDetector } from "./legacyBuiltins.mjs";
import { legendReactSubscriptionDetector } from "./legendReactSubscriptions.mjs";
import { noExplicitAnyDetector } from "./noExplicitAny.mjs";
import { preferConstDetector } from "./preferConst.mjs";
import { reactInputMutationDetector, staticComponentValueDetector, } from "./reactRenderPatterns.mjs";
import { missingReactListKeyDetector, unstableReactListKeyDetector, } from "./reactListKeys.mjs";
import { reactHookPlacementDetector } from "./reactHooks.mjs";
import { typeOnlyImportsDetector } from "./typeOnlyImports.mjs";
import { untrustedAssertionsDetector } from "./untrustedAssertions.mjs";
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
    derivedStateEffectDetector,
    reactInputMutationDetector,
    hookDependencySuppressionsDetector,
];
