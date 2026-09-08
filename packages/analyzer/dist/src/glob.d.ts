export declare const normalizeGlobPath: (value: string) => string;
export declare const expandGlobBraces: (pattern: string) => readonly string[];
export declare const globToRegExp: (inputPattern: string) => RegExp;
export declare const compileGlobs: (patterns?: readonly string[]) => RegExp[];
export declare const matchesAnyGlob: (filePath: string, compiledPatterns: readonly RegExp[]) => boolean;
