import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { checkPaths } from "../cli/check.mjs";

const fileCount = Number.parseInt(
  process.env.CODING_BIBLE_BENCH_FILES ?? "1000",
  10,
);
if (!Number.isInteger(fileCount) || fileCount < 1) {
  throw new Error("CODING_BIBLE_BENCH_FILES must be a positive integer.");
}

const parseOptionalLimit = (name) => {
  const raw = process.env[name];
  if (raw === undefined) {
    return null;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number when provided.`);
  }
  return value;
};

const maxColdMs = parseOptionalLimit("CODING_BIBLE_BENCH_MAX_MS");
const maxWarmMs = parseOptionalLimit("CODING_BIBLE_BENCH_MAX_WARM_MS");
const maxIncrementalMs = parseOptionalLimit(
  "CODING_BIBLE_BENCH_MAX_INCREMENTAL_MS",
);
const maxRssMb = parseOptionalLimit("CODING_BIBLE_BENCH_MAX_RSS_MB");

const directory = await mkdtemp(path.join(os.tmpdir(), "coding-bible-bench-"));

try {
  const srcDirectory = path.join(directory, "src");
  await mkdir(srcDirectory, { recursive: true });
  await writeFile(
    path.join(directory, "tsconfig.json"),
    JSON.stringify({ compilerOptions: { strict: true }, include: ["src"] }),
  );

  await Promise.all(
    Array.from({ length: fileCount }, (_, index) =>
      writeFile(
        path.join(srcDirectory, `module-${String(index).padStart(5, "0")}.ts`),
        `export const value${index} = ${index};\n`,
      ),
    ),
  );

  const cold = await checkPaths(["src"], {
    cwd: directory,
    profile: true,
  });
  const warm = await checkPaths(["src"], {
    cwd: directory,
    profile: true,
  });
  const changedFile = path.join(srcDirectory, "module-00000.ts");
  await writeFile(changedFile, "export const value0 = 1000;\n");
  const incremental = await checkPaths(["src"], {
    cwd: directory,
    profile: true,
  });

  const coldFilesPerSecond = cold.filesScanned / (cold.profile.totalMs / 1000);
  const warmFilesPerSecond = warm.filesScanned / (warm.profile.totalMs / 1000);
  const incrementalFilesPerSecond =
    incremental.filesScanned / (incremental.profile.totalMs / 1000);

  console.log("Coding Bible project benchmark");
  console.log(`  files       ${cold.filesScanned}`);
  console.log(`  cold        ${cold.profile.totalMs.toFixed(1)} ms`);
  console.log(
    `    cache     ${cold.profile.cacheMs.toFixed(1)} ms ` +
      `(${cold.profile.cacheHits} hits)`,
  );
  console.log(`    program   ${cold.profile.programMs.toFixed(1)} ms`);
  console.log(`    analysis  ${cold.profile.analysisMs.toFixed(1)} ms`);
  console.log(`    rate      ${coldFilesPerSecond.toFixed(0)} files/s`);
  console.log(`  warm        ${warm.profile.totalMs.toFixed(1)} ms`);
  console.log(
    `    cache     ${warm.profile.cacheMs.toFixed(1)} ms ` +
      `(${warm.profile.cacheHits} hits)`,
  );
  console.log(`    program   ${warm.profile.programMs.toFixed(1)} ms`);
  console.log(`    analysis  ${warm.profile.analysisMs.toFixed(1)} ms`);
  console.log(`    rate      ${warmFilesPerSecond.toFixed(0)} files/s`);
  console.log(`  edit 1 file ${incremental.profile.totalMs.toFixed(1)} ms`);
  console.log(
    `    cache     ${incremental.profile.cacheMs.toFixed(1)} ms ` +
      `(${incremental.profile.cacheHits} hits, ${incremental.profile.cacheMisses} misses)`,
  );
  console.log(`    program   ${incremental.profile.programMs.toFixed(1)} ms`);
  console.log(`    analysis  ${incremental.profile.analysisMs.toFixed(1)} ms`);
  console.log(`    rate      ${incrementalFilesPerSecond.toFixed(0)} files/s`);
  console.log(`  rss         ${incremental.profile.rssMb.toFixed(1)} MB`);

  if (maxColdMs !== null && cold.profile.totalMs > maxColdMs) {
    throw new Error(
      `Cold benchmark exceeded ${maxColdMs} ms (${cold.profile.totalMs.toFixed(1)} ms).`,
    );
  }
  if (maxWarmMs !== null && warm.profile.totalMs > maxWarmMs) {
    throw new Error(
      `Warm benchmark exceeded ${maxWarmMs} ms (${warm.profile.totalMs.toFixed(1)} ms).`,
    );
  }
  if (
    maxIncrementalMs !== null &&
    incremental.profile.totalMs > maxIncrementalMs
  ) {
    throw new Error(
      `Incremental benchmark exceeded ${maxIncrementalMs} ms (${incremental.profile.totalMs.toFixed(1)} ms).`,
    );
  }
  if (maxRssMb !== null && incremental.profile.rssMb > maxRssMb) {
    throw new Error(
      `Benchmark exceeded ${maxRssMb} MB RSS (${incremental.profile.rssMb.toFixed(1)} MB).`,
    );
  }
} finally {
  await rm(directory, { force: true, recursive: true });
}
