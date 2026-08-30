import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  createVirtualProject,
  createVirtualProjectPlans,
  toDisplayFileName,
} from "../src/analyzer/virtualProject.ts";

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

test("virtual projects load standard libraries and resolve local modules", () => {
  const project = createVirtualProject(
    [
      {
        fileName: "src/types.ts",
        source: "export interface User { name: string }",
      },
      {
        fileName: "src/users.ts",
        source:
          'import type { User } from "./types";\nexport const users: User[] = [{ name: "Ada" }];',
      },
    ],
    libraryFiles,
  );

  const usersFile = project.program.getSourceFile("/project/src/users.ts");
  assert.ok(usersFile);
  assert.equal(project.program.getSyntacticDiagnostics(usersFile).length, 0);
  assert.equal(project.program.getSemanticDiagnostics(usersFile).length, 0);
  assert.ok(
    project.program.getSourceFile("/typescript/lib/lib.es2022.full.d.ts"),
  );
  assert.deepEqual(
    project.inputs.map(({ fileName }) => toDisplayFileName(fileName)),
    ["src/types.ts", "src/users.ts"],
  );
});

test("virtual projects honor compiler options from a local tsconfig", () => {
  const project = createVirtualProject(
    [
      {
        fileName: "tsconfig.json",
        source: JSON.stringify({
          compilerOptions: {
            jsx: "react-jsx",
            strict: false,
            target: "ES2020",
          },
        }),
      },
      {
        fileName: "src/view.tsx",
        source: "export const View = () => <main />;",
      },
    ],
    libraryFiles,
    "tsconfig.json",
  );

  assert.equal(project.tsconfigFileName, "tsconfig.json");
  assert.equal(project.configurationDiagnostics.length, 0);
  assert.equal(project.program.getCompilerOptions().strict, false);
  assert.equal(project.program.getCompilerOptions().noEmit, true);
});

test("virtual projects resolve tsconfig path aliases across selected files", () => {
  const project = createVirtualProject(
    [
      {
        fileName: "tsconfig.json",
        source: JSON.stringify({
          compilerOptions: {
            baseUrl: ".",
            paths: { "@/*": ["src/*"] },
          },
        }),
      },
      {
        fileName: "src/types.ts",
        source: "export interface User { name: string }",
      },
      {
        fileName: "src/user.ts",
        source:
          'import type { User } from "@/types";\nexport const user: User = { name: "Ada" };',
      },
    ],
    libraryFiles,
    "tsconfig.json",
  );

  const userFile = project.program.getSourceFile("/project/src/user.ts");
  assert.ok(userFile);
  assert.equal(project.program.getSemanticDiagnostics(userFile).length, 0);
});

test("virtual projects resolve local tsconfig extends", () => {
  const project = createVirtualProject(
    [
      {
        fileName: "tsconfig.base.json",
        source: JSON.stringify({
          compilerOptions: { strict: false, target: "ES2020" },
        }),
      },
      {
        fileName: "tsconfig.json",
        source: JSON.stringify({ extends: "./tsconfig.base.json" }),
      },
      {
        fileName: "src/index.ts",
        source: "export const value = 1;",
      },
    ],
    libraryFiles,
    "tsconfig.json",
  );

  assert.equal(project.configurationDiagnostics.length, 0);
  assert.equal(project.program.getCompilerOptions().strict, false);
});

test("virtual project plans mirror nearest-tsconfig monorepo grouping", () => {
  const plans = createVirtualProjectPlans([
    { fileName: "tsconfig.json", source: "{}" },
    { fileName: "apps/web/tsconfig.json", source: "{}" },
    {
      fileName: "apps/web/src/App.tsx",
      source: "export const App = () => null;",
    },
    { fileName: "packages/rules/tsconfig.json", source: "{}" },
    {
      fileName: "packages/rules/src/index.ts",
      source: "export const rule = 1;",
    },
    { fileName: "scripts/release.ts", source: "export {};" },
  ]);

  assert.deepEqual(plans, [
    {
      fileNames: ["apps/web/src/App.tsx"],
      tsconfigFileName: "apps/web/tsconfig.json",
    },
    {
      fileNames: ["packages/rules/src/index.ts"],
      tsconfigFileName: "packages/rules/tsconfig.json",
    },
    { fileNames: ["scripts/release.ts"], tsconfigFileName: "tsconfig.json" },
  ]);
});

test("virtual project plans support config-driven source selection and tsconfig opt-out", () => {
  const files = [
    { fileName: "tsconfig.json", source: "{}" },
    { fileName: "src/include.ts", source: "export const include = 1;" },
    { fileName: "src/skip.ts", source: "export const skip = 1;" },
  ];

  assert.deepEqual(
    createVirtualProjectPlans(files, {
      shouldAnalyzeFile: (fileName) => fileName !== "src/skip.ts",
      tsconfig: false,
    }),
    [{ fileNames: ["src/include.ts"] }],
  );
});
