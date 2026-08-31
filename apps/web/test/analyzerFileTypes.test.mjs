import assert from "node:assert/strict";
import test from "node:test";

import {
  findNearestTsconfig,
  getAnalyzerLanguage,
  getProjectTsconfigFiles,
  hasIgnoredDirectory,
  isAnalyzableSourceFile,
  stripCommonRootDirectory,
} from "../src/analyzer/fileTypes.ts";

test("browser analyzer recognizes supported source extensions", () => {
  assert.equal(getAnalyzerLanguage("src/App.tsx"), "tsx");
  assert.equal(getAnalyzerLanguage("src/worker.mts"), "ts");
  assert.equal(getAnalyzerLanguage("scripts/build.cjs"), "js");
  assert.equal(getAnalyzerLanguage("src/global.d.ts"), "ts");
  assert.equal(getAnalyzerLanguage("README.md"), null);

  assert.equal(isAnalyzableSourceFile("src/App.tsx"), true);
  assert.equal(isAnalyzableSourceFile("src/global.d.ts"), false);
});

test("folder uploads strip one common browser root directory", () => {
  assert.deepEqual(
    stripCommonRootDirectory([
      "demo/src/App.tsx",
      "demo/src/types.ts",
      "demo/tsconfig.json",
    ]),
    ["src/App.tsx", "src/types.ts", "tsconfig.json"],
  );

  assert.deepEqual(stripCommonRootDirectory(["src/App.tsx", "tsconfig.json"]), [
    "src/App.tsx",
    "tsconfig.json",
  ]);
});

test("browser project filtering skips generated and vendor directories", () => {
  assert.equal(hasIgnoredDirectory("src/App.tsx"), false);
  assert.equal(hasIgnoredDirectory("node_modules/pkg/index.d.ts"), true);
  assert.equal(hasIgnoredDirectory(".coding-bible/report.json"), true);
  assert.equal(hasIgnoredDirectory("dist/index.js"), true);
  assert.equal(hasIgnoredDirectory("vendor/jquery/index.js"), true);
  assert.equal(hasIgnoredDirectory("src/generated/client.ts"), true);
  assert.equal(
    hasIgnoredDirectory("public/static/mraid/jquery.event.drag.js"),
    true,
  );
  assert.equal(
    hasIgnoredDirectory("apps/web/public/static/mraid/jquery.event.drag.js"),
    true,
  );
  assert.equal(hasIgnoredDirectory("src/runtime.min.js"), true);
  assert.equal(hasIgnoredDirectory("src/static/index.ts"), false);
  assert.equal(hasIgnoredDirectory("src/builders/index.ts"), false);
});

test("project files bind to their nearest canonical tsconfig", () => {
  const files = [
    { fileName: "tsconfig.json", source: "{}" },
    { fileName: "apps/web/tsconfig.json", source: "{}" },
    { fileName: "packages/rules/tsconfig.json", source: "{}" },
    { fileName: "tsconfig.base.json", source: "{}" },
  ];
  const configs = getProjectTsconfigFiles(files);

  assert.deepEqual(configs, [
    "apps/web/tsconfig.json",
    "packages/rules/tsconfig.json",
    "tsconfig.json",
  ]);
  assert.equal(
    findNearestTsconfig("apps/web/src/App.tsx", configs),
    "apps/web/tsconfig.json",
  );
  assert.equal(
    findNearestTsconfig("scripts/release.ts", configs),
    "tsconfig.json",
  );
});
