import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  analyzeProgram,
  analyzerFindingProfileSignature,
  analyzerFindingProfiles,
  detectors,
  getAnalyzerFindingProfile,
} from "../src/index.ts";
import {
  createProjectCacheSignatures,
  createProjectCacheIdentity,
  readProjectCache,
  writeProjectCache,
} from "../cli/cache.mjs";
import { checkPaths } from "../cli/check.mjs";
import {
  createProjectProgram,
  createSourceFileProgram,
  prepareProjectPlan,
} from "../cli/project.mjs";

const withFixture = async (callback) => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "coding-bible-hardening-"),
  );
  try {
    await callback(directory);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
};

const writeBasicProject = async (directory, files) => {
  await mkdir(path.join(directory, "src"), { recursive: true });
  await writeFile(
    path.join(directory, "tsconfig.json"),
    JSON.stringify({ compilerOptions: { strict: true }, include: ["src"] }),
  );
  for (const [name, source] of Object.entries(files)) {
    await writeFile(path.join(directory, "src", name), source);
  }
};

test("every detector declares an explicit dependency scope and finding profile", () => {
  assert.ok(detectors.length > 0);
  for (const detector of detectors) {
    assert.ok(
      detector.dependencyScope === "source-file" ||
        detector.dependencyScope === "project",
      `${detector.id} is missing a valid dependency scope`,
    );
    const profile = getAnalyzerFindingProfile(detector.id);
    assert.ok(profile, `${detector.id} is missing a finding profile`);
    assert.ok(
      ["high", "medium", "low"].includes(profile.impact),
      `${detector.id} is missing a valid impact`,
    );
    assert.ok(
      ["certain", "strong", "contextual"].includes(profile.confidence),
      `${detector.id} is missing a valid confidence`,
    );
    if (profile.confidence === "contextual") {
      assert.ok(
        profile.contextNote?.trim(),
        `${detector.id} must explain what context can change the conclusion`,
      );
    }
  }

  const detectorIds = new Set(detectors.map(({ id }) => id));
  assert.equal(
    detectorIds.size,
    detectors.length,
    "detector IDs must be unique",
  );
  for (const detectorId of Object.keys(analyzerFindingProfiles)) {
    assert.ok(
      detectorIds.has(detectorId),
      `${detectorId} has finding metadata but no registered detector`,
    );
  }
  assert.match(
    analyzerFindingProfileSignature,
    /^finding-profiles-v1-[a-f0-9]{8}$/u,
  );
});

test("source-file cache signatures ignore unrelated source content while project signatures do not", async () => {
  await withFixture(async (directory) => {
    await writeBasicProject(directory, {
      "target.ts": "export const target: any = 1;\n",
      "sibling.ts": "export const sibling = 1;\n",
    });
    const target = path.join(directory, "src", "target.ts");
    const sibling = path.join(directory, "src", "sibling.ts");
    const prepared = prepareProjectPlan(
      {
        configPath: path.join(directory, "tsconfig.json"),
        files: [target, sibling],
      },
      { cwd: directory },
    );

    const first = await createProjectCacheSignatures(prepared, {
      config: { include: ["**/*"], ignore: [] },
      rootDir: directory,
    });
    await writeFile(sibling, "export const sibling = 2;\n");
    const second = await createProjectCacheSignatures(prepared, {
      config: { include: ["**/*"], ignore: [] },
      rootDir: directory,
    });

    assert.equal(
      first.sourceSignatures["src/target.ts"],
      second.sourceSignatures["src/target.ts"],
    );
    assert.notEqual(
      first.sourceSignatures["src/sibling.ts"],
      second.sourceSignatures["src/sibling.ts"],
    );
    assert.notEqual(first.projectSignature, second.projectSignature);
  });
});

test("isolated source-file Programs preserve current detector results", async () => {
  await withFixture(async (directory) => {
    await writeBasicProject(directory, {
      "sample.tsx": [
        'import { type User } from "./types";',
        "const items: User[] = [];",
        "const bad: any = 1;",
        'const page = parseInt("1");',
        "export const View = () =>",
        "  items.map((item, index) => <span key={index}>{item}</span>);",
        "",
      ].join("\n"),
      "types.ts": "export type User = string;\n",
    });
    const fileName = path.join(directory, "src", "sample.tsx");
    const prepared = prepareProjectPlan(
      { configPath: path.join(directory, "tsconfig.json"), files: [fileName] },
      { cwd: directory },
    );
    const full = createProjectProgram(prepared);
    const isolated = createSourceFileProgram(prepared, [fileName]);
    const input = [{ fileName, language: "tsx" }];

    const fullResult = analyzeProgram(full.program, input, {
      dependencyScope: "source-file",
    })[0];
    const isolatedResult = analyzeProgram(isolated.program, input, {
      dependencyScope: "source-file",
    })[0];

    assert.deepEqual(isolatedResult, fullResult);
  });
});

test("corrupted cache files are ignored and replaced safely", async () => {
  await withFixture(async (directory) => {
    await writeBasicProject(directory, {
      "index.ts": "export const value: any = 1;\n",
    });
    await checkPaths(["src"], { cwd: directory });
    const cacheDirectory = path.join(directory, ".coding-bible", "cache");
    const [cacheFile] = await readdir(cacheDirectory);
    assert.ok(cacheFile);
    await writeFile(
      path.join(cacheDirectory, cacheFile),
      "{ definitely not json",
    );

    const result = await checkPaths(["src"], { cwd: directory, profile: true });
    assert.equal(result.cache.hits, 0);
    assert.equal(result.cache.misses, 1);
    assert.equal(result.findings[0]?.ruleId, "TS-001");
    JSON.parse(await readFile(path.join(cacheDirectory, cacheFile), "utf8"));
  });
});

test("compiler configuration and dependency metadata invalidate source-file cache", async () => {
  await withFixture(async (directory) => {
    await writeBasicProject(directory, {
      "index.ts": "export const value: any = 1;\n",
    });
    await writeFile(
      path.join(directory, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.0.0" }),
    );
    await checkPaths(["src"], { cwd: directory });
    const warm = await checkPaths(["src"], { cwd: directory });
    assert.equal(warm.cache.hits, 1);

    await writeFile(
      path.join(directory, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: false }, include: ["src"] }),
    );
    const compilerChanged = await checkPaths(["src"], { cwd: directory });
    assert.equal(compilerChanged.cache.hits, 0);
    assert.equal(compilerChanged.cache.misses, 1);

    const warmAgain = await checkPaths(["src"], { cwd: directory });
    assert.equal(warmAgain.cache.hits, 1);
    await writeFile(
      path.join(directory, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.0.1" }),
    );
    const packageChanged = await checkPaths(["src"], { cwd: directory });
    assert.equal(packageChanged.cache.hits, 0);
    assert.equal(packageChanged.cache.misses, 1);
  });
});

test("malformed tsconfig fails deterministically instead of falling back silently", async () => {
  await withFixture(async (directory) => {
    await mkdir(path.join(directory, "src"), { recursive: true });
    await writeFile(
      path.join(directory, "src", "index.ts"),
      "export const value = 1;\n",
    );
    await writeFile(path.join(directory, "tsconfig.json"), "{ nope");

    await assert.rejects(
      checkPaths(["src"], { cwd: directory }),
      /tsconfig|expected|property|invalid/i,
    );
  });
});

test("project-reference scans remain cache-conservative and do not crash", async () => {
  await withFixture(async (directory) => {
    await mkdir(path.join(directory, "src"), { recursive: true });
    await mkdir(path.join(directory, "dependency"), { recursive: true });
    await writeFile(
      path.join(directory, "src", "index.ts"),
      "export const value: any = 1;\n",
    );
    await writeFile(
      path.join(directory, "dependency", "tsconfig.json"),
      JSON.stringify({ compilerOptions: { composite: true }, files: [] }),
    );
    await writeFile(
      path.join(directory, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { strict: true },
        include: ["src"],
        references: [{ path: "./dependency" }],
      }),
    );

    const first = await checkPaths(["src"], { cwd: directory, profile: true });
    const second = await checkPaths(["src"], { cwd: directory, profile: true });
    assert.equal(first.findings.length, 1);
    assert.equal(second.findings.length, 1);
    assert.equal(first.cache.hits, 0);
    assert.equal(second.cache.hits, 0);
  });
});

test("large flat source files scan without recursion or duplicate-finding failures", async () => {
  await withFixture(async (directory) => {
    const declarations = Array.from(
      { length: 5000 },
      (_, index) => `export const value${index} = ${index};`,
    ).join("\n");
    await writeBasicProject(directory, {
      "large.ts": `${declarations}\nexport const unsafe: any = 1;\n`,
    });

    const result = await checkPaths(["src"], { cwd: directory });
    assert.equal(
      result.findings.filter(({ ruleId }) => ruleId === "TS-001").length,
      1,
    );
  });
});

test("cache schema can represent source-local and project-sensitive entries independently", async () => {
  await withFixture(async (directory) => {
    const cacheDirectory = path.join(directory, "cache");
    const identity = createProjectCacheIdentity({
      rootDir: directory,
      tsconfigPath: null,
    });
    const result = {
      checksRun: 1,
      diagnostics: [],
      findings: [],
      ruleIdsChecked: ["TS-001"],
    };
    await writeProjectCache(cacheDirectory, identity, {
      sourceResults: { "src/a.ts": { signature: "source-a", result } },
      projectResults: { "src/a.ts": { signature: "project-a", result } },
    });

    const cached = await readProjectCache(cacheDirectory, identity);
    assert.equal(cached.sourceResults["src/a.ts"].signature, "source-a");
    assert.equal(cached.projectResults["src/a.ts"].signature, "project-a");
  });
});
