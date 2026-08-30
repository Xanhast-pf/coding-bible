import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

const typescriptLibModuleId = "virtual:coding-bible-typescript-libs";
const resolvedTypescriptLibModuleId = `\0${typescriptLibModuleId}`;

const createTypescriptLibPlugin = (): Plugin => ({
  name: "coding-bible-typescript-libs",
  resolveId(id) {
    return id === typescriptLibModuleId ? resolvedTypescriptLibModuleId : null;
  },
  load(id) {
    if (id !== resolvedTypescriptLibModuleId) {
      return null;
    }

    const require = createRequire(import.meta.url);
    const typescriptLibDirectory = dirname(require.resolve("typescript"));
    const libraryFiles = Object.fromEntries(
      readdirSync(typescriptLibDirectory)
        .filter((fileName) => /^lib(?:\..+)?\.d\.ts$/.test(fileName))
        .sort()
        .map((fileName) => [
          fileName,
          readFileSync(join(typescriptLibDirectory, fileName), "utf8"),
        ]),
    );

    return `export const typescriptLibs = ${JSON.stringify(libraryFiles)};`;
  },
});

export default defineConfig({
  base: "/coding-bible/",
  plugins: [react(), createTypescriptLibPlugin()],
  worker: {
    plugins: () => [createTypescriptLibPlugin()],
  },
});
