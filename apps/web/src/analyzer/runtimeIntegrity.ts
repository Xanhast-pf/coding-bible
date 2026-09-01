import { detectors, type Detector } from "@coding-bible/analyzer";

const requiredLegacyJsDetectorIds = [
  "semantic-interactive-element",
  "keyboard-interaction",
  "accessible-control-name",
  "react-direct-component-call",
  "legend-react-use-value",
  "react-list-missing-key",
  "react-list-unstable-key",
  "react-static-component-value",
  "react-input-mutation",
  "hardcoded-jsx-text",
] as const;

export const getBrowserAnalyzerRuntimeIntegrityError = (
  runtimeDetectors: readonly Detector[] = detectors,
) => {
  const detectorsById = new Map(
    runtimeDetectors.map((detector) => [detector.id, detector]),
  );
  const incompatible = requiredLegacyJsDetectorIds.filter((detectorId) => {
    const detector = detectorsById.get(detectorId);
    return !detector || !detector.languages?.includes("js");
  });

  if (!incompatible.length) {
    return null;
  }

  return `Browser analyzer runtime integrity check failed for: ${incompatible.join(", ")}. Reload the page before analyzing again.`;
};
