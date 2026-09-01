import type {
  AnalyzerFindingConfidence,
  AnalyzerFindingImpact,
} from "./types.ts";

export interface AnalyzerFindingProfile {
  confidence: AnalyzerFindingConfidence;
  contextNote?: string;
  impact: AnalyzerFindingImpact;
}

export const analyzerFindingProfiles = {
  "accessible-control-name": { confidence: "certain", impact: "high" },
  "default-parameter-normalization": { confidence: "certain", impact: "low" },
  "graphql-runtime-interpolation": { confidence: "certain", impact: "high" },
  "hardcoded-jsx-text": {
    confidence: "contextual",
    contextNote:
      "Some user-visible strings, such as brand names, protocol labels, or intentionally invariant technical terms, may be correct to leave untranslated.",
    impact: "medium",
  },
  "keyboard-interaction": { confidence: "certain", impact: "high" },
  "legend-react-use-value": {
    confidence: "contextual",
    contextNote:
      "The observable read is real, but whether it should be replaced depends on the project's Legend-State/React integration and compiler/subscription expectations.",
    impact: "medium",
  },
  "namespace-safe-builtins": { confidence: "certain", impact: "low" },
  "no-explicit-any": {
    confidence: "contextual",
    contextNote:
      "`any` can be an intentional interoperability boundary. Prefer narrowing the boundary, but review whether stronger upstream types are realistically available.",
    impact: "medium",
  },
  "non-mutating-collection-copy": {
    confidence: "strong",
    contextNote:
      "In-place mutation can be intentional when the receiver is a disposable/private copy; verify ownership and identity expectations before changing it.",
    impact: "low",
  },
  "optional-chaining-guard-chain": {
    confidence: "contextual",
    contextNote:
      "Optional chaining is equivalent only when null/undefined are the intended guards; `&&` also preserves behavior for other falsy values such as 0, false, and an empty string.",
    impact: "low",
  },
  "prefer-const": { confidence: "certain", impact: "low" },
  "react-derived-state-effect": {
    confidence: "strong",
    contextNote:
      "Mirrored state can be intentional when it represents an independently editable snapshot; verify user interaction and reset semantics before removing it.",
    impact: "medium",
  },
  "react-direct-component-call": {
    confidence: "strong",
    contextNote:
      "This looks like a React component by local definition and naming; verify it is intended to be a component rather than a plain render helper.",
    impact: "high",
  },
  "react-hook-dependency-suppression": {
    confidence: "contextual",
    contextNote:
      "The suppression is definite, but a deliberate dependency model can occasionally justify it. Review closure and synchronization semantics before changing dependencies.",
    impact: "medium",
  },
  "react-hook-placement": {
    confidence: "strong",
    contextNote:
      "Hook-named bindings in tests can sometimes be replaced by mocks that are not real Hooks; review test setup before treating those cases as runtime violations.",
    impact: "high",
  },
  "react-input-mutation": { confidence: "certain", impact: "high" },
  "react-list-missing-key": { confidence: "certain", impact: "medium" },
  "react-list-unstable-key": {
    confidence: "contextual",
    contextNote:
      "Array-position keys can be acceptable for a truly static, never-reordered list; review whether item order or membership can change.",
    impact: "low",
  },
  "react-static-component-value": {
    confidence: "contextual",
    contextNote:
      "A fresh object/array identity can occasionally be intentional when a consumer relies on per-render identity or mutates the value.",
    impact: "low",
  },
  "redundant-async-function": {
    confidence: "strong",
    contextNote:
      "An external callback/interface contract may intentionally require a Promise even when asynchronous work is not visible in this function body.",
    impact: "medium",
  },
  "semantic-interactive-element": { confidence: "certain", impact: "high" },
  "type-only-imports": { confidence: "certain", impact: "low" },
  "unknown-type-assertion": {
    confidence: "contextual",
    contextNote:
      "Compatibility shims and weak third-party typings sometimes require assertions. Prefer validation or stronger upstream types, but review the boundary before treating the cast as a bug.",
    impact: "medium",
  },
  "untrusted-data-assertion": {
    confidence: "strong",
    contextNote:
      "Validation may exist outside the local expression. Confirm the value is actually validated at a trusted boundary before removing or changing the assertion.",
    impact: "high",
  },
} as const satisfies Readonly<Record<string, AnalyzerFindingProfile>>;

export const getAnalyzerFindingProfile = (
  detectorId: string,
): AnalyzerFindingProfile | undefined =>
  analyzerFindingProfiles[detectorId as keyof typeof analyzerFindingProfiles];
