import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";

import { analyzeBrowserInput } from "../src/analyzer/analyzeBrowserInput.ts";

const require = createRequire(import.meta.url);
const typescriptLibDirectory = dirname(require.resolve("typescript"));
const libraryFiles = Object.fromEntries(
  readdirSync(typescriptLibDirectory)
    .filter((fileName) => /^lib(?:\..+)?\.d\.ts$/.test(fileName))
    .map((fileName) => [
      fileName,
      readFileSync(join(typescriptLibDirectory, fileName), "utf8"),
    ]),
);
const readFixture = (name) =>
  readFileSync(
    new URL(
      `../../../packages/analyzer/test/fixtures/${name}.tsx.fixture`,
      import.meta.url,
    ),
    "utf8",
  );

test("browser analysis preserves the canonical clean/violation detector contract", () => {
  const clean = analyzeBrowserInput(
    {
      files: [{ fileName: "all-clean.tsx", source: readFixture("all-clean") }],
      mode: "snippet",
    },
    libraryFiles,
  );
  const violations = analyzeBrowserInput(
    {
      files: [
        {
          fileName: "all-violations.tsx",
          source: readFixture("all-violations"),
        },
      ],
      mode: "snippet",
    },
    libraryFiles,
  );

  assert.equal(clean.files[0]?.result.findings.length, 0);
  assert.equal(clean.files[0]?.result.checksRun, 21);
  assert.equal(violations.files[0]?.result.findings.length, 23);
  assert.equal(
    new Set(violations.files[0]?.result.findings.map(({ ruleId }) => ruleId))
      .size,
    20,
  );
});

test("browser analysis applies independent tsconfigs inside a monorepo", () => {
  const result = analyzeBrowserInput(
    {
      files: [
        {
          fileName: "apps/web/tsconfig.json",
          source: JSON.stringify({ compilerOptions: { strict: true } }),
        },
        {
          fileName: "apps/web/src/app.ts",
          source: "const unsafe: any = 1;",
        },
        {
          fileName: "packages/core/tsconfig.json",
          source: JSON.stringify({ compilerOptions: { strict: false } }),
        },
        {
          fileName: "packages/core/src/index.ts",
          source: "export const value = 1;",
        },
      ],
      mode: "project",
    },
    libraryFiles,
  );

  assert.deepEqual(result.tsconfigFileNames, [
    "apps/web/tsconfig.json",
    "packages/core/tsconfig.json",
  ]);
  assert.equal(result.files.length, 2);
  assert.deepEqual(
    result.files.flatMap(({ result: fileResult }) =>
      fileResult.findings.map(({ ruleId }) => ruleId),
    ),
    ["TS-001"],
  );
});

test("browser project analysis honors JSON config includes, ignores, severities, and overrides", () => {
  const result = analyzeBrowserInput(
    {
      files: [
        {
          fileName: "coding-bible.config.json",
          source: JSON.stringify({
            include: ["src/**/*"],
            ignore: ["src/ignored/**"],
            packs: { typescript: "warning" },
            rules: { "TS-003": "off" },
            overrides: [
              {
                files: ["src/strict/**"],
                rules: { "TS-001": "error" },
              },
            ],
          }),
        },
        { fileName: "src/warning.ts", source: "const value: any = 1;" },
        {
          fileName: "src/strict/error.ts",
          source: "const value: any = 1;",
        },
        {
          fileName: "src/ignored/bad.ts",
          source: "const value: any = 1;",
        },
        { fileName: "outside.ts", source: "const value: any = 1;" },
      ],
      mode: "project",
    },
    libraryFiles,
  );

  assert.equal(result.configFileName, "coding-bible.config.json");
  assert.equal(result.sourceFileCount, 2);
  assert.deepEqual(
    result.files.flatMap(({ fileName, result: fileResult }) =>
      fileResult.findings.map(({ ruleId, severity }) => [
        fileName,
        ruleId,
        severity,
      ]),
    ),
    [
      ["src/strict/error.ts", "TS-001", "error"],
      ["src/warning.ts", "TS-001", "warning"],
    ],
  );
  assert.equal(
    result.files.some(({ result: fileResult }) =>
      fileResult.ruleIdsChecked.includes("TS-003"),
    ),
    false,
  );
});

test("browser project analysis skips default vendor and compiled source paths", () => {
  const result = analyzeBrowserInput(
    {
      files: [
        { fileName: "src/index.ts", source: "export const value = 1;" },
        { fileName: "vendor/legacy.ts", source: "const unsafe: any = 1;" },
        {
          fileName: "public/static/jquery.js",
          source: "const unsafe = parseInt(raw);",
        },
        {
          fileName: "src/bundle.min.js",
          source: "const unsafe = parseInt(raw);",
        },
      ],
      mode: "project",
    },
    libraryFiles,
  );

  assert.equal(result.sourceFileCount, 1);
  assert.deepEqual(
    result.files.map(({ fileName }) => fileName),
    ["src/index.ts"],
  );
});

test("browser project analysis reports executable config modules instead of silently ignoring them", () => {
  const result = analyzeBrowserInput(
    {
      files: [
        {
          fileName: "coding-bible.config.ts",
          source: 'export default { rules: { "TS-001": "off" } };',
        },
        { fileName: "src/bad.ts", source: "const value: any = 1;" },
      ],
      mode: "project",
    },
    libraryFiles,
  );

  assert.equal(result.configFileName, "coding-bible.config.ts");
  assert.match(
    result.configurationDiagnostics.join("\n"),
    /not executed in the browser/,
  );
  assert.equal(
    result.files
      .flatMap(({ result: fileResult }) => fileResult.findings)
      .some(({ ruleId }) => ruleId === "TS-001"),
    true,
  );
});

test("browser project analysis honors a configured tsconfig path", () => {
  const result = analyzeBrowserInput(
    {
      files: [
        {
          fileName: "coding-bible.config.json",
          source: JSON.stringify({ tsconfig: "tsconfig.browser.json" }),
        },
        {
          fileName: "tsconfig.browser.json",
          source: JSON.stringify({
            compilerOptions: { strict: false },
            include: ["src/**/*"],
          }),
        },
        { fileName: "src/index.ts", source: "export const value = 1;" },
      ],
      mode: "project",
    },
    libraryFiles,
  );

  assert.deepEqual(result.tsconfigFileNames, ["tsconfig.browser.json"]);
  assert.equal(result.configurationDiagnostics.length, 0);
});

test("browser analysis applies the persistent local rule selection as an extra filter", () => {
  const result = analyzeBrowserInput(
    {
      files: [
        {
          fileName: "sample.ts",
          source: "const unsafe: any = 1;\nconst page = parseInt(raw);\n",
        },
      ],
      mode: "snippet",
      ruleSelection: { include: ["TS-001"] },
    },
    libraryFiles,
  );

  const fileResult = result.files[0]?.result;
  assert.deepEqual(result.ruleSelection, { include: ["TS-001"] });
  assert.deepEqual(fileResult?.ruleIdsChecked, ["TS-001"]);
  assert.deepEqual(
    fileResult?.findings.map(({ ruleId }) => ruleId),
    ["TS-001"],
  );
});
