interface AnalyzerFindingFingerprintInput {
  detectorId: string;
  excerpt: string;
  file: string;
  message: string;
  ruleId: string;
}

const normalizeFingerprintText = (value: string) =>
  value.replace(/\s+/gu, " ").trim();

export const createAnalyzerFindingFingerprintPayload = ({
  detectorId,
  excerpt,
  file,
  message,
  ruleId,
}: AnalyzerFindingFingerprintInput) =>
  [
    ruleId,
    detectorId,
    file.replaceAll("\\", "/"),
    normalizeFingerprintText(excerpt),
    normalizeFingerprintText(message),
  ].join("\0");
