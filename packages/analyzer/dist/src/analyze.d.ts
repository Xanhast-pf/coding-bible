import ts from "typescript";
import type { AnalyzeInput, AnalyzeOptions, AnalyzeResult, ProgramAnalyzeInput } from "./types.js";
export declare const analyzeMany: (inputs: readonly AnalyzeInput[], options?: AnalyzeOptions) => readonly AnalyzeResult[];
export declare const analyzeProgram: (program: ts.Program, inputs: readonly ProgramAnalyzeInput[], options?: AnalyzeOptions) => readonly AnalyzeResult[];
export declare const analyze: (input: AnalyzeInput, options?: AnalyzeOptions) => AnalyzeResult;
