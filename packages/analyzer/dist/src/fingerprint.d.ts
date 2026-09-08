interface AnalyzerFindingFingerprintInput {
    detectorId: string;
    excerpt: string;
    file: string;
    message: string;
    ruleId: string;
}
export declare const createAnalyzerFindingFingerprintPayload: ({ detectorId, excerpt, file, message, ruleId, }: AnalyzerFindingFingerprintInput) => string;
export {};
