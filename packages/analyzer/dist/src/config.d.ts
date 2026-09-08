import { type AnalyzerConfig, type AnalyzerCustomRule, type AnalyzerPack, type AnalyzerRuleSelection, type AnalyzerRuleSetting } from "./types.js";
export declare const analyzerConfigFileNames: readonly ["coding-bible.config.ts", "coding-bible.config.mts", "coding-bible.config.mjs", "coding-bible.config.js", "coding-bible.config.cjs", "coding-bible.config.json"];
export declare const defaultAnalyzerIgnorePatterns: readonly ["**/.coding-bible/**", "**/.git/**", "**/.next/**", "**/.turbo/**", "**/build/**", "**/coverage/**", "**/dist/**", "**/generated/**", "**/node_modules/**", "**/out/**", "**/third-party/**", "**/third_party/**", "**/vendor/**", "**/vendors/**", "**/public/static/**", "**/*.d.ts", "**/*.generated.*", "**/*.min.{js,jsx,mjs,cjs,ts,tsx,mts,cts}", "**/__generated__/**"];
export declare const analyzerRuleIds: string[];
export declare const getConfiguredAnalyzerRuleIds: (config?: Pick<AnalyzerConfig, "customRules">) => readonly string[];
export declare const getAnalyzerCustomRuleFilePaths: (value: unknown) => readonly string[];
export declare const normalizeAnalyzerRuleSelection: (selection?: AnalyzerRuleSelection, ruleIds?: readonly string[]) => AnalyzerRuleSelection;
export declare const createAnalyzerRuleSelectionPredicate: (selection?: AnalyzerRuleSelection, ruleIds?: readonly string[]) => (ruleId: string) => boolean;
export declare const validateAnalyzerConfig: (value: unknown, { additionalCustomRules, }?: {
    additionalCustomRules?: readonly AnalyzerCustomRule[];
}) => AnalyzerConfig;
export interface ResolvedAnalyzerConfig extends AnalyzerConfig {
    include: readonly string[];
    ignore: readonly string[];
}
export declare const resolveAnalyzerConfigDefaults: (config: AnalyzerConfig) => ResolvedAnalyzerConfig;
export declare const getAnalyzerPack: (ruleId: string) => AnalyzerPack | null;
export declare const createAnalyzerConfigResolver: (config: AnalyzerConfig, toRelativeFilePath?: (filePath: string) => string) => {
    getRuleSetting: (ruleId: string, filePath: string) => AnalyzerRuleSetting;
    isRuleEnabled: (ruleId: string, filePath: string) => boolean;
};
export declare const createAnalyzerFileSelector: (config: ResolvedAnalyzerConfig) => (filePath: string) => boolean;
export declare const defineConfig: <const TConfig extends AnalyzerConfig>(config: TConfig) => TConfig;
