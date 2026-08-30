import {
  getProjectTsconfigFiles,
  hasIgnoredDirectory,
  isAnalyzableSourceFile,
  isProjectTextFile,
  stripCommonRootDirectory,
} from "./fileTypes";
import type { BrowserProjectFile } from "./types";

const maxProjectFiles = 2_500;
const maxProjectBytes = 32 * 1024 * 1024;

export interface BrowserProjectSelection {
  files: readonly BrowserProjectFile[];
  ignoredFileCount: number;
  projectName: string;
  sourceFileCount: number;
  totalBytes: number;
  tsconfigFileNames: readonly string[];
}

const formatProjectLimit = () => {
  const maxProjectMegabytes = Math.round(maxProjectBytes / 1024 / 1024);

  return `${maxProjectFiles.toLocaleString()} text files / ${maxProjectMegabytes} MB`;
};

export const readProjectSelection = async (
  fileList: FileList,
): Promise<BrowserProjectSelection> => {
  const selectedFiles = Array.from(fileList);
  if (!selectedFiles.length) {
    throw new Error("Choose a project folder first.");
  }

  const rawNames = selectedFiles.map(
    (file) => file.webkitRelativePath || file.name,
  );
  const projectName =
    rawNames[0]?.replaceAll("\\", "/").split("/")[0] || "project";
  const relativeNames = stripCommonRootDirectory(rawNames);
  const candidates = selectedFiles.flatMap((file, index) => {
    const fileName = relativeNames[index];
    if (
      !fileName ||
      hasIgnoredDirectory(fileName) ||
      !isProjectTextFile(fileName)
    ) {
      return [];
    }

    return [{ file, fileName }];
  });

  if (!candidates.length) {
    throw new Error(
      "No TypeScript, JavaScript, declaration, or JSON files were found.",
    );
  }

  const totalBytes = candidates.reduce(
    (total, { file }) => total + file.size,
    0,
  );
  if (candidates.length > maxProjectFiles || totalBytes > maxProjectBytes) {
    throw new Error(
      `This browser analyzer is capped at ${formatProjectLimit()} per run. Exclude generated/vendor folders or analyze a smaller workspace.`,
    );
  }

  const files = await Promise.all(
    candidates.map(async ({ file, fileName }) => ({
      fileName,
      source: await file.text(),
    })),
  );
  const sourceFileCount = files.filter(({ fileName }) =>
    isAnalyzableSourceFile(fileName),
  ).length;

  if (!sourceFileCount) {
    throw new Error(
      "No analyzable TypeScript or JavaScript source files were found.",
    );
  }

  return {
    files,
    ignoredFileCount: selectedFiles.length - candidates.length,
    projectName,
    sourceFileCount,
    totalBytes,
    tsconfigFileNames: getProjectTsconfigFiles(files),
  };
};

export const formatByteSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
