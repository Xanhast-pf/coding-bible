import { a11y001Detectors } from "./accessibility/A11Y-001-semantic-interactive-element.mjs";
import { a11y002Detectors } from "./accessibility/A11Y-002-keyboard-interaction.mjs";
import { a11y003Detectors } from "./accessibility/A11Y-003-keep-focus-visible.mjs";
import { a11y004Detectors } from "./accessibility/A11Y-004-accessible-control-name.mjs";
import { a11y005Detectors } from "./accessibility/A11Y-005-do-not-communicate-with-color-alone.mjs";
import { a11y006Detectors } from "./accessibility/A11Y-006-respect-reduced-motion-preferences.mjs";
import { apollo002Detectors } from "./apollo/APOLLO-002-choose-fetch-policies-deliberately.mjs";
import { apollo003Detectors } from "./apollo/APOLLO-003-return-modified-entities-from-mutations.mjs";
import { apollo005Detectors } from "./apollo/APOLLO-005-encode-pagination-and-merge-semantics-in-field-policies.mjs";
import { apollo006Detectors } from "./apollo/APOLLO-006-handle-graphql-errors-and-partial-data-intentionally.mjs";
import { core003Detectors } from "./core/CORE-003-prefer-const.mjs";
import { core006Detectors } from "./core/CORE-006-name-meaningful-constants.mjs";
import { core008Detectors } from "./core/CORE-008-reduce-nesting-when-it-improves-clarity.mjs";
import { core010Detectors } from "./core/CORE-010-keep-the-public-surface-minimal.mjs";
import { core011Detectors } from "./core/CORE-011-hoist-context-free-helpers.mjs";
import { flag002Detectors } from "./feature-flags/FLAG-002-delete-flags-after-rollout.mjs";
import { flag003Detectors } from "./feature-flags/FLAG-003-keep-flag-decisions-at-clear-boundaries.mjs";
import { flag004Detectors } from "./feature-flags/FLAG-004-test-both-reachable-flag-states.mjs";
import { gql001Detectors } from "./graphql/GQL-001-name-production-operations.mjs";
import { gql002Detectors } from "./graphql/GQL-002-runtime-template-interpolation.mjs";
import { gql003Detectors } from "./graphql/GQL-003-use-fragments-for-genuinely-shared-selection-sets.mjs";
import { gql005Detectors } from "./graphql/GQL-005-treat-nullability-as-part-of-the-contract.mjs";
import { i18n001Detectors } from "./internationalization/I18N-001-hardcoded-jsx-text.mjs";
import { i18n002Detectors } from "./internationalization/I18N-002-parameterize-messages-instead-of-concatenating-sentences.mjs";
import { i18n003Detectors } from "./internationalization/I18N-003-intl-date-formatting.mjs";
import { i18n004Detectors } from "./internationalization/I18N-004-design-layouts-for-text-expansion-and-direction.mjs";
import { js001Detectors } from "./javascript/JS-001-redundant-async.mjs";
import { js002Detectors } from "./javascript/JS-002-optional-chaining.mjs";
import { js003Detectors } from "./javascript/JS-003-default-parameters.mjs";
import { js004Detectors } from "./javascript/JS-004-namespace-safe-builtins.mjs";
import { js005Detectors } from "./javascript/JS-005-scope-try-catch-to-the-operation-that-can-fail.mjs";
import { js006Detectors } from "./javascript/JS-006-non-mutating-collections.mjs";
import { js007Detectors } from "./javascript/JS-007-use-an-options-object-when-positional-parameters-stop-being-obvious.mjs";
import { legend001Detectors } from "./legend-state/LEGEND-001-react-subscriptions.mjs";
import { legend002Detectors } from "./legend-state/LEGEND-002-use-peek-only-when-non-reactive-access-is-intentional.mjs";
import { legend003Detectors } from "./legend-state/LEGEND-003-update-observable-state-through-observable-apis.mjs";
import { legend004Detectors } from "./legend-state/LEGEND-004-batch-sibling-updates.mjs";
import { legend005Detectors } from "./legend-state/LEGEND-005-subscribe-at-the-narrowest-useful-observable.mjs";
import { legend006Detectors } from "./legend-state/LEGEND-006-keep-persisted-or-synchronized-state-serializable.mjs";
import { next001Detectors } from "./nextjs/NEXT-001-default-to-server-components.mjs";
import { next002Detectors } from "./nextjs/NEXT-002-keep-use-client-boundaries-as-small-as-practical.mjs";
import { next003Detectors } from "./nextjs/NEXT-003-pass-serializable-props-across-the-server-client-boundary.mjs";
import { next004Detectors } from "./nextjs/NEXT-004-protect-server-only-code-from-client-imports.mjs";
import { next005Detectors } from "./nextjs/NEXT-005-fetch-server-data-directly-from-server-components.mjs";
import { next006Detectors } from "./nextjs/NEXT-006-avoid-avoidable-data-fetching-waterfalls.mjs";
import { react002Detectors } from "./react/REACT-002-do-not-memoize-by-reflex.mjs";
import { react004Detectors } from "./react/REACT-004-derived-state-effect.mjs";
import { react005Detectors } from "./react/REACT-005-use-effects-to-synchronize-external-systems.mjs";
import { react006Detectors } from "./react/REACT-006-stable-list-keys.mjs";
import { react007Detectors } from "./react/REACT-007-keep-render-pure.mjs";
import { react008Detectors } from "./react/REACT-008-static-render-values.mjs";
import { react009Detectors } from "./react/REACT-009-hook-placement.mjs";
import { react010Detectors } from "./react/REACT-010-direct-component-calls.mjs";
import { react011Detectors } from "./react/REACT-011-input-mutation.mjs";
import { react012Detectors } from "./react/REACT-012-hook-dependency-suppressions.mjs";
import { redux001Detectors } from "./redux/REDUX-001-use-redux-toolkit-for-modern-redux.mjs";
import { redux002Detectors } from "./redux/REDUX-002-keep-reducers-pure.mjs";
import { redux003Detectors } from "./redux/REDUX-003-keep-redux-state-and-normal-actions-serializable.mjs";
import { redux004Detectors } from "./redux/REDUX-004-keep-redux-state-minimal-and-derive-the-rest.mjs";
import { redux005Detectors } from "./redux/REDUX-005-normalize-complex-relational-collections.mjs";
import { redux006Detectors } from "./redux/REDUX-006-use-selectors-to-encapsulate-state-shape.mjs";
import { redux007Detectors } from "./redux/REDUX-007-memoize-selectors-only-when-they-derive-expensive-or-referentially-new-values.mjs";
import { redux009Detectors } from "./redux/REDUX-009-single-store.mjs";
import { redux011Detectors } from "./redux/REDUX-011-prefer-rtk-query-for-server-data-in-redux-applications.mjs";
import { tq001Detectors } from "./tanstack-query/TQ-001-query-key-dependencies.mjs";
import { tq002Detectors } from "./tanstack-query/TQ-002-keep-query-keys-serializable-and-deterministic.mjs";
import { tq003Detectors } from "./tanstack-query/TQ-003-configure-freshness-instead-of-fighting-refetch-behavior.mjs";
import { tq004Detectors } from "./tanstack-query/TQ-004-invalidate-related-queries-after-successful-mutations.mjs";
import { tq005Detectors } from "./tanstack-query/TQ-005-make-query-functions-reject-failed-requests.mjs";
import { test005Detectors } from "./testing/TEST-005-use-snapshots-selectively.mjs";
import { ts001Detectors } from "./typescript/TS-001-no-explicit-any.mjs";
import { ts002Detectors } from "./typescript/TS-002-keep-types-narrow.mjs";
import { ts003Detectors } from "./typescript/TS-003-type-only-imports.mjs";
import { ts004Detectors } from "./typescript/TS-004-untrusted-data-assertions.mjs";
import { ts005Detectors } from "./typescript/TS-005-optional-means-genuinely-optional.mjs";
import { ts006Detectors } from "./typescript/TS-006-model-variants-as-discriminated-unions.mjs";
import { ts007Detectors } from "./typescript/TS-007-unsafe-unknown-assertions.mjs";
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
