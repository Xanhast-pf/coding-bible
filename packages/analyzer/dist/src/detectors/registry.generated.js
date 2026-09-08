import { a11y001Detectors } from "./accessibility/A11Y-001-semantic-interactive-element.js";
import { a11y002Detectors } from "./accessibility/A11Y-002-keyboard-interaction.js";
import { a11y003Detectors } from "./accessibility/A11Y-003-keep-focus-visible.js";
import { a11y004Detectors } from "./accessibility/A11Y-004-accessible-control-name.js";
import { a11y005Detectors } from "./accessibility/A11Y-005-do-not-communicate-with-color-alone.js";
import { a11y006Detectors } from "./accessibility/A11Y-006-respect-reduced-motion-preferences.js";
import { apollo002Detectors } from "./apollo/APOLLO-002-choose-fetch-policies-deliberately.js";
import { apollo003Detectors } from "./apollo/APOLLO-003-return-modified-entities-from-mutations.js";
import { apollo005Detectors } from "./apollo/APOLLO-005-encode-pagination-and-merge-semantics-in-field-policies.js";
import { apollo006Detectors } from "./apollo/APOLLO-006-handle-graphql-errors-and-partial-data-intentionally.js";
import { core003Detectors } from "./core/CORE-003-prefer-const.js";
import { core006Detectors } from "./core/CORE-006-name-meaningful-constants.js";
import { core008Detectors } from "./core/CORE-008-reduce-nesting-when-it-improves-clarity.js";
import { core010Detectors } from "./core/CORE-010-keep-the-public-surface-minimal.js";
import { core011Detectors } from "./core/CORE-011-hoist-context-free-helpers.js";
import { flag002Detectors } from "./feature-flags/FLAG-002-delete-flags-after-rollout.js";
import { flag003Detectors } from "./feature-flags/FLAG-003-keep-flag-decisions-at-clear-boundaries.js";
import { flag004Detectors } from "./feature-flags/FLAG-004-test-both-reachable-flag-states.js";
import { gql001Detectors } from "./graphql/GQL-001-name-production-operations.js";
import { gql002Detectors } from "./graphql/GQL-002-runtime-template-interpolation.js";
import { gql003Detectors } from "./graphql/GQL-003-use-fragments-for-genuinely-shared-selection-sets.js";
import { gql005Detectors } from "./graphql/GQL-005-treat-nullability-as-part-of-the-contract.js";
import { i18n001Detectors } from "./internationalization/I18N-001-hardcoded-jsx-text.js";
import { i18n002Detectors } from "./internationalization/I18N-002-parameterize-messages-instead-of-concatenating-sentences.js";
import { i18n003Detectors } from "./internationalization/I18N-003-intl-date-formatting.js";
import { i18n004Detectors } from "./internationalization/I18N-004-design-layouts-for-text-expansion-and-direction.js";
import { js001Detectors } from "./javascript/JS-001-redundant-async.js";
import { js002Detectors } from "./javascript/JS-002-optional-chaining.js";
import { js003Detectors } from "./javascript/JS-003-default-parameters.js";
import { js004Detectors } from "./javascript/JS-004-namespace-safe-builtins.js";
import { js005Detectors } from "./javascript/JS-005-scope-try-catch-to-the-operation-that-can-fail.js";
import { js006Detectors } from "./javascript/JS-006-non-mutating-collections.js";
import { js007Detectors } from "./javascript/JS-007-use-an-options-object-when-positional-parameters-stop-being-obvious.js";
import { legend001Detectors } from "./legend-state/LEGEND-001-react-subscriptions.js";
import { legend002Detectors } from "./legend-state/LEGEND-002-use-peek-only-when-non-reactive-access-is-intentional.js";
import { legend003Detectors } from "./legend-state/LEGEND-003-update-observable-state-through-observable-apis.js";
import { legend004Detectors } from "./legend-state/LEGEND-004-batch-sibling-updates.js";
import { legend005Detectors } from "./legend-state/LEGEND-005-subscribe-at-the-narrowest-useful-observable.js";
import { legend006Detectors } from "./legend-state/LEGEND-006-keep-persisted-or-synchronized-state-serializable.js";
import { next001Detectors } from "./nextjs/NEXT-001-default-to-server-components.js";
import { next002Detectors } from "./nextjs/NEXT-002-keep-use-client-boundaries-as-small-as-practical.js";
import { next003Detectors } from "./nextjs/NEXT-003-pass-serializable-props-across-the-server-client-boundary.js";
import { next004Detectors } from "./nextjs/NEXT-004-protect-server-only-code-from-client-imports.js";
import { next005Detectors } from "./nextjs/NEXT-005-fetch-server-data-directly-from-server-components.js";
import { next006Detectors } from "./nextjs/NEXT-006-avoid-avoidable-data-fetching-waterfalls.js";
import { react002Detectors } from "./react/REACT-002-do-not-memoize-by-reflex.js";
import { react004Detectors } from "./react/REACT-004-derived-state-effect.js";
import { react005Detectors } from "./react/REACT-005-use-effects-to-synchronize-external-systems.js";
import { react006Detectors } from "./react/REACT-006-stable-list-keys.js";
import { react007Detectors } from "./react/REACT-007-keep-render-pure.js";
import { react008Detectors } from "./react/REACT-008-static-render-values.js";
import { react009Detectors } from "./react/REACT-009-hook-placement.js";
import { react010Detectors } from "./react/REACT-010-direct-component-calls.js";
import { react011Detectors } from "./react/REACT-011-input-mutation.js";
import { react012Detectors } from "./react/REACT-012-hook-dependency-suppressions.js";
import { redux001Detectors } from "./redux/REDUX-001-use-redux-toolkit-for-modern-redux.js";
import { redux002Detectors } from "./redux/REDUX-002-keep-reducers-pure.js";
import { redux003Detectors } from "./redux/REDUX-003-keep-redux-state-and-normal-actions-serializable.js";
import { redux004Detectors } from "./redux/REDUX-004-keep-redux-state-minimal-and-derive-the-rest.js";
import { redux005Detectors } from "./redux/REDUX-005-normalize-complex-relational-collections.js";
import { redux006Detectors } from "./redux/REDUX-006-use-selectors-to-encapsulate-state-shape.js";
import { redux007Detectors } from "./redux/REDUX-007-memoize-selectors-only-when-they-derive-expensive-or-referentially-new-values.js";
import { redux009Detectors } from "./redux/REDUX-009-single-store.js";
import { redux011Detectors } from "./redux/REDUX-011-prefer-rtk-query-for-server-data-in-redux-applications.js";
import { tq001Detectors } from "./tanstack-query/TQ-001-query-key-dependencies.js";
import { tq002Detectors } from "./tanstack-query/TQ-002-keep-query-keys-serializable-and-deterministic.js";
import { tq003Detectors } from "./tanstack-query/TQ-003-configure-freshness-instead-of-fighting-refetch-behavior.js";
import { tq004Detectors } from "./tanstack-query/TQ-004-invalidate-related-queries-after-successful-mutations.js";
import { tq005Detectors } from "./tanstack-query/TQ-005-make-query-functions-reject-failed-requests.js";
import { test005Detectors } from "./testing/TEST-005-use-snapshots-selectively.js";
import { ts001Detectors } from "./typescript/TS-001-no-explicit-any.js";
import { ts002Detectors } from "./typescript/TS-002-keep-types-narrow.js";
import { ts003Detectors } from "./typescript/TS-003-type-only-imports.js";
import { ts004Detectors } from "./typescript/TS-004-untrusted-data-assertions.js";
import { ts005Detectors } from "./typescript/TS-005-optional-means-genuinely-optional.js";
import { ts006Detectors } from "./typescript/TS-006-model-variants-as-discriminated-unions.js";
import { ts007Detectors } from "./typescript/TS-007-unsafe-unknown-assertions.js";
export const detectors = [
    ...a11y001Detectors,
    ...a11y002Detectors,
    ...a11y003Detectors,
    ...a11y004Detectors,
    ...a11y005Detectors,
    ...a11y006Detectors,
    ...apollo002Detectors,
    ...apollo003Detectors,
    ...apollo005Detectors,
    ...apollo006Detectors,
    ...core003Detectors,
    ...core006Detectors,
    ...core008Detectors,
    ...core010Detectors,
    ...core011Detectors,
    ...flag002Detectors,
    ...flag003Detectors,
    ...flag004Detectors,
    ...gql001Detectors,
    ...gql002Detectors,
    ...gql003Detectors,
    ...gql005Detectors,
    ...i18n001Detectors,
    ...i18n002Detectors,
    ...i18n003Detectors,
    ...i18n004Detectors,
    ...js001Detectors,
    ...js002Detectors,
    ...js003Detectors,
    ...js004Detectors,
    ...js005Detectors,
    ...js006Detectors,
    ...js007Detectors,
    ...legend001Detectors,
    ...legend002Detectors,
    ...legend003Detectors,
    ...legend004Detectors,
    ...legend005Detectors,
    ...legend006Detectors,
    ...next001Detectors,
    ...next002Detectors,
    ...next003Detectors,
    ...next004Detectors,
    ...next005Detectors,
    ...next006Detectors,
    ...react002Detectors,
    ...react004Detectors,
    ...react005Detectors,
    ...react006Detectors,
    ...react007Detectors,
    ...react008Detectors,
    ...react009Detectors,
    ...react010Detectors,
    ...react011Detectors,
    ...react012Detectors,
    ...redux001Detectors,
    ...redux002Detectors,
    ...redux003Detectors,
    ...redux004Detectors,
    ...redux005Detectors,
    ...redux006Detectors,
    ...redux007Detectors,
    ...redux009Detectors,
    ...redux011Detectors,
    ...tq001Detectors,
    ...tq002Detectors,
    ...tq003Detectors,
    ...tq004Detectors,
    ...tq005Detectors,
    ...test005Detectors,
    ...ts001Detectors,
    ...ts002Detectors,
    ...ts003Detectors,
    ...ts004Detectors,
    ...ts005Detectors,
    ...ts006Detectors,
    ...ts007Detectors,
];
