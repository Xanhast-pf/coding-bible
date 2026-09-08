import ts from "typescript";
import type { AnalyzerLanguage, DetectorContext } from "./types.js";
export interface ResolvedAnalyzeInput {
    fileName: string;
    language: AnalyzerLanguage;
    source: string;
}
export declare const createDetectorContextsFromProgram: (inputs: readonly ResolvedAnalyzeInput[], program: ts.Program) => readonly DetectorContext[];
export declare const createDetectorContexts: (inputs: readonly ResolvedAnalyzeInput[]) => readonly DetectorContext[];
export declare const createDetectorContext: (input: ResolvedAnalyzeInput) => DetectorContext;
