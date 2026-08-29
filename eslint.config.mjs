import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

const sourceFiles = "**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}";
const typescriptFiles = "**/*.{ts,cts,mts,tsx}";

export default defineConfig(
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/.cache/**",
      "**/.vite/**",
      "packages/analyzer/test/fixtures/**",
    ],
  },
  {
    files: [sourceFiles],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: globals.nodeBuiltin,
    },
  },
  {
    files: [typescriptFiles],
    rules: {
      "no-undef": "off",
    },
  },
  {
    files: ["apps/web/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.nodeBuiltin,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",
    },
  },
  eslintConfigPrettier,
);
