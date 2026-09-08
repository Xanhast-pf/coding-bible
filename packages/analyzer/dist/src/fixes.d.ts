import type { AnalyzerTextEdit } from "./types.js";
export declare const normalizeAnalyzerPatchPath: (filePath: string) => string;
export declare const applyAnalyzerTextEdits: (source: string, edits: readonly AnalyzerTextEdit[]) => string;
export declare const prepareAnalyzerTextEdits: (source: string, edits: readonly AnalyzerTextEdit[], filePath: string) => readonly AnalyzerTextEdit[];
export declare const createAnalyzerFilePatch: (filePath: string, source: string, edits: readonly AnalyzerTextEdit[]) => string;
