import type { AnalyzerConfig } from "./types.ts";

export const defineConfig = <const TConfig extends AnalyzerConfig>(
  config: TConfig,
): TConfig => config;
