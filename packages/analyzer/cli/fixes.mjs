import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  analyze,
  applyAnalyzerTextEdits,
  createAnalyzerFilePatch,
  normalizeAnalyzerPatchPath,
  prepareAnalyzerTextEdits,
} from "../src/index.ts";
import { languageByExtension } from "./project.mjs";
import { createAnalyzerReport } from "./report.mjs";

const defaultOutputDirectory = ".coding-bible";

const collectFileFixes = async (result, safety) => {
  const byFile = new Map();

  for (const finding of result.findings) {
    if (finding.fix?.safety !== safety || !finding.fix.edits?.length) {
      continue;
    }

    const entry = byFile.get(finding.filePath) ?? { findings: [], edits: [] };
    entry.findings.push(finding);
    entry.edits.push(...finding.fix.edits);
    byFile.set(finding.filePath, entry);
  }

  const plans = [];
  for (const [filePath, entry] of [...byFile.entries()].sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    const absolutePath = path.resolve(result.rootDir, filePath);
    const source = await readFile(absolutePath, "utf8");
    let edits;
    try {
      edits = prepareAnalyzerTextEdits(source, entry.edits, filePath);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Conflicting analyzer fixes")
      ) {
        throw new Error(
          `Conflicting ${safety} analyzer fixes overlap in ${filePath}.`,
        );
      }
      throw error;
    }

    plans.push({
      absolutePath,
      edits,
      filePath,
      findings: entry.findings,
      source,
    });
  }

  return plans;
};

const verifySafePlans = (plans) => {
  for (const plan of plans) {
    const language = languageByExtension.get(path.extname(plan.absolutePath));
    if (!language) {
      continue;
    }

    for (const finding of plan.findings) {
      if (!finding.fix?.edits?.length) {
        continue;
      }

      const fixedSource = applyAnalyzerTextEdits(
        plan.source,
        finding.fix.edits,
      );
      const verification = analyze({
        fileName: plan.absolutePath,
        language,
        source: fixedSource,
      });
      const stillPresent = verification.findings.some(
        (candidate) =>
          candidate.detectorId === finding.detectorId &&
          candidate.ruleId === finding.ruleId &&
          candidate.location.line === finding.location.line,
      );

      if (stillPresent) {
        throw new Error(
          `Safe fix verification failed for ${finding.ruleId} in ${plan.filePath}:${finding.location.line}.`,
        );
      }
    }
  }
};

export const createFixPatch = async (result, safety) => {
  const plans = await collectFileFixes(result, safety);
  if (safety === "safe") {
    verifySafePlans(plans);
  }

  const filePatches = plans.map((plan) =>
    createAnalyzerFilePatch(plan.filePath, plan.source, plan.edits),
  );

  return {
    files: plans.length,
    fixes: plans.reduce((count, plan) => count + plan.findings.length, 0),
    patch: filePatches.length ? `${filePatches.join("\n")}\n` : "",
  };
};

export const writeAnalysisArtifacts = async (
  result,
  {
    includeReviewFixes = false,
    outputDirectory = defaultOutputDirectory,
    patch = false,
    report = false,
  } = {},
) => {
  if (!report && !patch) {
    return { files: [], report: createAnalyzerReport(result) };
  }

  const absoluteDirectory = path.resolve(result.rootDir, outputDirectory);
  await mkdir(absoluteDirectory, { recursive: true });
  const displayDirectory = normalizeAnalyzerPatchPath(
    path.relative(result.rootDir, absoluteDirectory) ||
      path.basename(absoluteDirectory),
  );
  const written = [];
  let safePatch = null;
  let reviewPatch = null;
  let safePatchPath = null;
  let reviewPatchPath = null;

  if (patch) {
    safePatch = await createFixPatch(result, "safe");
    if (safePatch.fixes) {
      const filePath = path.join(absoluteDirectory, "safe-fixes.patch");
      await writeFile(filePath, safePatch.patch, "utf8");
      safePatchPath = `${displayDirectory}/safe-fixes.patch`;
      written.push(path.relative(result.rootDir, filePath));
    }
  }

  if (includeReviewFixes) {
    reviewPatch = await createFixPatch(result, "review");
    if (reviewPatch.fixes) {
      const filePath = path.join(absoluteDirectory, "review-fixes.patch");
      await writeFile(filePath, reviewPatch.patch, "utf8");
      reviewPatchPath = `${displayDirectory}/review-fixes.patch`;
      written.push(path.relative(result.rootDir, filePath));
    }
  }

  const analyzerReport = createAnalyzerReport(result, {
    patchFiles: {
      review: reviewPatchPath,
      safe: safePatchPath,
    },
  });
  if (report) {
    const filePath = path.join(absoluteDirectory, "report.json");
    await writeFile(
      filePath,
      `${JSON.stringify(analyzerReport, null, 2)}\n`,
      "utf8",
    );
    written.unshift(path.relative(result.rootDir, filePath));
  }

  return {
    files: written,
    report: analyzerReport,
    reviewPatch,
    safePatch,
  };
};
