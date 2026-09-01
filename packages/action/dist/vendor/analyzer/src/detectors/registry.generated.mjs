import { a11y001Detectors } from "./accessibility/A11Y-001-semantic-interactive-element.mjs";
import { a11y002Detectors } from "./accessibility/A11Y-002-keyboard-interaction.mjs";
import { a11y004Detectors } from "./accessibility/A11Y-004-accessible-control-name.mjs";
import { core003Detectors } from "./core/CORE-003-prefer-const.mjs";
import { gql002Detectors } from "./graphql/GQL-002-runtime-template-interpolation.mjs";
import { i18n001Detectors } from "./internationalization/I18N-001-hardcoded-jsx-text.mjs";
import { js001Detectors } from "./javascript/JS-001-redundant-async.mjs";
import { js002Detectors } from "./javascript/JS-002-optional-chaining.mjs";
import { js003Detectors } from "./javascript/JS-003-default-parameters.mjs";
import { js004Detectors } from "./javascript/JS-004-namespace-safe-builtins.mjs";
import { js006Detectors } from "./javascript/JS-006-non-mutating-collections.mjs";
import { legend001Detectors } from "./legend-state/LEGEND-001-react-subscriptions.mjs";
import { react004Detectors } from "./react/REACT-004-derived-state-effect.mjs";
import { react006Detectors } from "./react/REACT-006-stable-list-keys.mjs";
import { react008Detectors } from "./react/REACT-008-static-render-values.mjs";
import { react009Detectors } from "./react/REACT-009-hook-placement.mjs";
import { react010Detectors } from "./react/REACT-010-direct-component-calls.mjs";
import { react011Detectors } from "./react/REACT-011-input-mutation.mjs";
import { react012Detectors } from "./react/REACT-012-hook-dependency-suppressions.mjs";
import { ts001Detectors } from "./typescript/TS-001-no-explicit-any.mjs";
import { ts003Detectors } from "./typescript/TS-003-type-only-imports.mjs";
import { ts004Detectors } from "./typescript/TS-004-untrusted-data-assertions.mjs";
import { ts007Detectors } from "./typescript/TS-007-unsafe-unknown-assertions.mjs";
export const detectors = [
    ...a11y001Detectors,
    ...a11y002Detectors,
    ...a11y004Detectors,
    ...core003Detectors,
    ...gql002Detectors,
    ...i18n001Detectors,
    ...js001Detectors,
    ...js002Detectors,
    ...js003Detectors,
    ...js004Detectors,
    ...js006Detectors,
    ...legend001Detectors,
    ...react004Detectors,
    ...react006Detectors,
    ...react008Detectors,
    ...react009Detectors,
    ...react010Detectors,
    ...react011Detectors,
    ...react012Detectors,
    ...ts001Detectors,
    ...ts003Detectors,
    ...ts004Detectors,
    ...ts007Detectors,
];
