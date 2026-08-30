import type { AnalyzerLanguage } from "@coding-bible/analyzer";

import type { BrowserProjectFile } from "./types";

const sourceExtensionLanguages = [
  [".d.mts", "ts"],
  [".d.cts", "ts"],
  [".d.ts", "ts"],
  [".tsx", "tsx"],
  [".mts", "ts"],
  [".cts", "ts"],
  [".ts", "ts"],
  [".jsx", "jsx"],
  [".mjs", "js"],
  [".cjs", "js"],
  [".js", "js"],
] as const satisfies readonly (readonly [string, AnalyzerLanguage])[];

const projectTextExtensions = [
  ...sourceExtensionLanguages.map(([extension]) => extension),
  ".json",
] as const;

const ignoredDirectoryNames = new Set([
  ".cache",
  ".coding-bible",
  ".git",
  ".next",
  ".turbo",
  ".vite",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
]);

export const getAnalyzerLanguage = (
  fileName: string,
): AnalyzerLanguage | null => {
  const lowerFileName = fileName.toLowerCase();
  const match = sourceExtensionLanguages.find(([extension]) =>
    lowerFileName.endsWith(extension),
  );

  return match?.[1] ?? null;
};

export const isDeclarationFile = (fileName: string) =>
  /\.d\.(?:c|m)?ts$/i.test(fileName);

export const isAnalyzableSourceFile = (fileName: string) =>
  getAnalyzerLanguage(fileName) !== null && !isDeclarationFile(fileName);

export const isProjectTextFile = (fileName: string) => {
  const lowerFileName = fileName.toLowerCase();
  return projectTextExtensions.some((extension) =>
    lowerFileName.endsWith(extension),
  );
};

export const normalizeRelativeFileName = (fileName: string) => {
  const normalizedSegments: string[] = [];

  for (const segment of fileName.replaceAll("\\", "/").split("/")) {
    if (!segment || segment === ".") {
      continue;
    }

    if (segment === "..") {
      normalizedSegments.pop();
      continue;
    }

    normalizedSegments.push(segment);
  }

  return normalizedSegments.join("/");
};

export const stripCommonRootDirectory = (fileNames: readonly string[]) => {
  const normalized = fileNames.map(normalizeRelativeFileName);
  const firstSegments = normalized.map((fileName) => fileName.split("/")[0]);
  const commonRoot = firstSegments[0];

  if (
    !commonRoot ||
    !normalized.every(
      (fileName, index) =>
        firstSegments[index] === commonRoot && fileName.includes("/"),
    )
  ) {
    return normalized;
  }

  return normalized.map((fileName) => fileName.slice(commonRoot.length + 1));
};

export const hasIgnoredDirectory = (fileName: string) =>
  normalizeRelativeFileName(fileName)
    .split("/")
    .some((segment) => ignoredDirectoryNames.has(segment));

export const getProjectTsconfigFiles = (
  files: readonly BrowserProjectFile[],
): readonly string[] =>
  files
    .map(({ fileName }) => normalizeRelativeFileName(fileName))
    .filter((fileName) => /(^|\/)tsconfig\.json$/i.test(fileName))
    .sort((left, right) => left.localeCompare(right));

export const findNearestTsconfig = (
  fileName: string,
  tsconfigFileNames: readonly string[],
): string | undefined => {
  const configs = new Set(tsconfigFileNames.map(normalizeRelativeFileName));
  const normalized = normalizeRelativeFileName(fileName);
  let directory = normalized.includes("/")
    ? normalized.slice(0, normalized.lastIndexOf("/"))
    : "";

  while (true) {
    const candidate = directory
      ? `${directory}/tsconfig.json`
      : "tsconfig.json";
    if (configs.has(candidate)) {
      return candidate;
    }

    if (!directory) {
      return undefined;
    }

    const separator = directory.lastIndexOf("/");
    directory = separator === -1 ? "" : directory.slice(0, separator);
  }
};
