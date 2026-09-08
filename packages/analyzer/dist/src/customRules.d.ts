import { type AnalyzerCustomRule, type AnalyzerCustomRuleBook, type Detector } from "./types.js";
export declare const analyzerCustomRuleBookFormatVersion: 1;
export declare const validateAnalyzerCustomRules: (value: unknown, name?: string) => readonly AnalyzerCustomRule[];
export declare const validateAnalyzerCustomRuleBook: (value: unknown, sourceName?: string) => AnalyzerCustomRuleBook;
export declare const defineCustomRule: <const TRule extends AnalyzerCustomRule>(rule: TRule) => TRule;
export declare const defineCustomRuleBook: <const TRuleBook extends AnalyzerCustomRuleBook>(ruleBook: TRuleBook) => TRuleBook;
export declare const defineDetector: <const TDetector extends Detector>(detector: TDetector) => TDetector;
export declare const createAnalyzerCustomRuleDetectors: (value: unknown) => readonly Detector[];
