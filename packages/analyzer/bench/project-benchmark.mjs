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

const maxMs = parseOptionalLimit("CODING_BIBLE_BENCH_MAX_MS");
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

  const result = await checkPaths(["src"], {
    cwd: directory,
    profile: true,
  });
  const filesPerSecond = result.filesScanned / (result.profile.totalMs / 1000);

  console.log(`Coding Bible project benchmark`);
  console.log(`  files       ${result.filesScanned}`);
  console.log(`  total       ${result.profile.totalMs.toFixed(1)} ms`);
  console.log(`  discovery   ${result.profile.discoveryMs.toFixed(1)} ms`);
  console.log(`  program     ${result.profile.programMs.toFixed(1)} ms`);
  console.log(`  analysis    ${result.profile.analysisMs.toFixed(1)} ms`);
  console.log(`  throughput  ${filesPerSecond.toFixed(0)} files/s`);
  console.log(`  rss         ${result.profile.rssMb.toFixed(1)} MB`);

  if (maxMs !== null && result.profile.totalMs > maxMs) {
    throw new Error(
      `Benchmark exceeded ${maxMs} ms (${result.profile.totalMs.toFixed(1)} ms).`,
    );
  }
  if (maxRssMb !== null && result.profile.rssMb > maxRssMb) {
    throw new Error(
      `Benchmark exceeded ${maxRssMb} MB RSS (${result.profile.rssMb.toFixed(1)} MB).`,
    );
  }
} finally {
  await rm(directory, { force: true, recursive: true });
}
