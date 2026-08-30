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
  assert.equal(clean.files[0]?.result.checksRun, 20);
  assert.equal(violations.files[0]?.result.findings.length, 22);
  assert.equal(
    new Set(violations.files[0]?.result.findings.map(({ ruleId }) => ruleId))
      .size,
    19,
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
