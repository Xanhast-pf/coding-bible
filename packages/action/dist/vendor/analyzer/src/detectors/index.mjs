import { detectors } from "./registry.generated.mjs";
export { detectors } from "./registry.generated.mjs";
const hashDetectorContract = (value) => {
    let hash = 0x811c9dc5;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
};
const detectorContract = detectors
    .map(({ dependencyScope, id, languages, ruleId }) => `${id}:${ruleId}:${dependencyScope}:${languages?.join(",") ?? "*"}`)
    .join("|");
export const analyzerDetectorCount = detectors.length;
export const analyzerDetectorSignature = `detectors-v1-${hashDetectorContract(detectorContract)}`;
