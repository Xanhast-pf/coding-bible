const normalizeFingerprintText = (value) => value.replace(/\s+/gu, " ").trim();
export const createAnalyzerFindingFingerprintPayload = ({ detectorId, excerpt, file, message, ruleId, }) => [
    ruleId,
    detectorId,
    file.replaceAll("\\", "/"),
    normalizeFingerprintText(excerpt),
    normalizeFingerprintText(message),
].join("\0");
