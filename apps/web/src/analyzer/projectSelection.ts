import {
  getProjectTsconfigFiles,
  hasIgnoredDirectory,
  isAnalyzableSourceFile,
  isProjectTextFile,
  stripCommonRootDirectory,
} from "./fileTypes";
import {
  getProjectResourceWarning,
  readProjectFiles,
} from "./projectIngestion";
import type { ProjectReadOptions } from "./projectIngestion";
import type { BrowserProjectFile } from "./types";

export { formatByteSize } from "./projectIngestion";

export interface BrowserProjectSelection {
  files: readonly BrowserProjectFile[];
  ignoredFileCount: number;
  projectName: string;
  resourceWarning: string | null;
  sourceFileCount: number;
  totalBytes: number;
  tsconfigFileNames: readonly string[];
}

export const readProjectSelection = async (
  fileList: FileList,
  options: ProjectReadOptions = {},
): Promise<BrowserProjectSelection> => {
  const selectedFiles = Array.from(fileList);
  if (!selectedFiles.length) {
    throw new Error("Choose a project folder first.");
  }

  options.signal?.throwIfAborted();

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
  const files = await readProjectFiles(candidates, options);
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
    resourceWarning: getProjectResourceWarning(candidates.length, totalBytes),
    sourceFileCount,
    totalBytes,
    tsconfigFileNames: getProjectTsconfigFiles(files),
  };
};
