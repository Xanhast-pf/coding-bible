import type { ProgramAnalyzeInput } from "@coding-bible/analyzer";
import ts from "typescript";

import {
  findNearestTsconfig,
  getAnalyzerLanguage,
  getProjectTsconfigFiles,
  isProjectTextFile,
  normalizeRelativeFileName,
} from "./fileTypes.ts";
import type { BrowserProjectFile } from "./types";

const projectRoot = "/project";
const typescriptLibRoot = "/typescript/lib";

const defaultCompilerOptions: ts.CompilerOptions = {
  allowJs: true,
  checkJs: false,
  jsx: ts.JsxEmit.Preserve,
  noEmit: true,
  strict: true,
  target: ts.ScriptTarget.ES2022,
};

const normalizeAbsolutePath = (fileName: string) => {
  const isAbsolute = fileName.startsWith("/");
  const segments: string[] = [];

  for (const segment of fileName.replaceAll("\\", "/").split("/")) {
    if (!segment || segment === ".") {
      continue;
    }

    if (segment === "..") {
      segments.pop();
      continue;
    }

    segments.push(segment);
  }

  return `${isAbsolute ? "/" : ""}${segments.join("/")}`;
};

const joinPath = (base: string, fileName: string) =>
  normalizeAbsolutePath(`${base}/${fileName}`);

const getDirectoryName = (fileName: string) => {
  const normalized = normalizeAbsolutePath(fileName);
  const separator = normalized.lastIndexOf("/");
  return separator <= 0 ? "/" : normalized.slice(0, separator);
};

const toProjectPath = (fileName: string) =>
  joinPath(projectRoot, normalizeRelativeFileName(fileName));

const createVirtualFileSystem = (
  files: readonly BrowserProjectFile[],
  libraryFiles: Readonly<Record<string, string>>,
) => {
  const contents = new Map<string, string>();

  for (const file of files) {
    contents.set(toProjectPath(file.fileName), file.source);
  }

  for (const [fileName, source] of Object.entries(libraryFiles)) {
    contents.set(joinPath(typescriptLibRoot, fileName), source);
  }

  const fileNames = [...contents.keys()];

  const fileExists = (fileName: string) =>
    contents.has(normalizeAbsolutePath(fileName));
  const readFile = (fileName: string) =>
    contents.get(normalizeAbsolutePath(fileName));
  const directoryExists = (directoryName: string) => {
    const normalized = `${normalizeAbsolutePath(directoryName).replace(
      /\/$/,
      "",
    )}/`;
    return fileNames.some((fileName) => fileName.startsWith(normalized));
  };
  const getDirectories = (directoryName: string) => {
    const normalized = `${normalizeAbsolutePath(directoryName).replace(
      /\/$/,
      "",
    )}/`;
    const directories = new Set<string>();

    for (const fileName of fileNames) {
      if (!fileName.startsWith(normalized)) {
        continue;
      }

      const remainder = fileName.slice(normalized.length);
      const separator = remainder.indexOf("/");
      if (separator !== -1) {
        directories.add(joinPath(normalized, remainder.slice(0, separator)));
      }
    }

    return [...directories];
  };
  const readDirectory = (
    rootDir: string,
    extensions: readonly string[],
    _excludes: readonly string[] | undefined,
    _includes: readonly string[],
    depth?: number,
  ) => {
    const normalizedRoot = `${normalizeAbsolutePath(rootDir).replace(
      /\/$/,
      "",
    )}/`;

    return fileNames.filter((fileName) => {
      if (!fileName.startsWith(normalizedRoot)) {
        return false;
      }

      if (
        extensions.length &&
        !extensions.some((extension) => fileName.endsWith(extension))
      ) {
        return false;
      }

      if (depth === undefined) {
        return true;
      }

      const relative = fileName.slice(normalizedRoot.length);
      return relative.split("/").length - 1 <= depth;
    });
  };

  return {
    contents,
    directoryExists,
    fileExists,
    getDirectories,
    readDirectory,
    readFile,
  };
};

const formatDiagnostic = (diagnostic: ts.Diagnostic) =>
  ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");

export interface VirtualProjectBuild {
  configurationDiagnostics: readonly string[];
  inputs: readonly ProgramAnalyzeInput[];
  program: ts.Program;
  tsconfigFileName: string | null;
}

export const createVirtualProject = (
  files: readonly BrowserProjectFile[],
  libraryFiles: Readonly<Record<string, string>>,
  tsconfigFileName?: string,
  selectedFileNames?: readonly string[],
): VirtualProjectBuild => {
  const virtualFileSystem = createVirtualFileSystem(files, libraryFiles);
  const configurationDiagnostics: string[] = [];
  const configPath = tsconfigFileName
    ? toProjectPath(tsconfigFileName)
    : undefined;

  let compilerOptions = { ...defaultCompilerOptions };

  if (configPath) {
    const configSource = virtualFileSystem.readFile(configPath);
    if (!configSource) {
      configurationDiagnostics.push(
        `Could not read ${tsconfigFileName ?? "tsconfig.json"}. Using browser defaults.`,
      );
    } else {
      const parsedJson = ts.parseConfigFileTextToJson(configPath, configSource);
      if (parsedJson.error) {
        configurationDiagnostics.push(formatDiagnostic(parsedJson.error));
      } else {
        const configHost: ts.ParseConfigHost = {
          directoryExists: virtualFileSystem.directoryExists,
          fileExists: virtualFileSystem.fileExists,
          getDirectories: virtualFileSystem.getDirectories,
          readDirectory: virtualFileSystem.readDirectory,
          readFile: virtualFileSystem.readFile,
          realpath: normalizeAbsolutePath,
          useCaseSensitiveFileNames: true,
        };
        const parsedConfig = ts.parseJsonConfigFileContent(
          parsedJson.config,
          configHost,
          getDirectoryName(configPath),
          {},
          configPath,
        );

        configurationDiagnostics.push(
          ...parsedConfig.errors.map(formatDiagnostic),
        );
        compilerOptions = {
          ...parsedConfig.options,
          allowJs: true,
          noEmit: true,
        };
      }
    }
  }

  const sourceFileCache = new Map<string, ts.SourceFile>();
  const compilerHost: ts.CompilerHost = {
    directoryExists: virtualFileSystem.directoryExists,
    fileExists: virtualFileSystem.fileExists,
    getCanonicalFileName: normalizeAbsolutePath,
    getCurrentDirectory: () => projectRoot,
    getDefaultLibFileName: (options) =>
      joinPath(typescriptLibRoot, ts.getDefaultLibFileName(options)),
    getDefaultLibLocation: () => typescriptLibRoot,
    getDirectories: virtualFileSystem.getDirectories,
    getNewLine: () => "\n",
    getSourceFile: (fileName, languageVersionOrOptions) => {
      const normalizedFileName = normalizeAbsolutePath(fileName);
      const cached = sourceFileCache.get(normalizedFileName);
      if (cached) {
        return cached;
      }

      const source = virtualFileSystem.readFile(normalizedFileName);
      if (source === undefined) {
        return undefined;
      }

      const sourceFile = ts.createSourceFile(
        normalizedFileName,
        source,
        languageVersionOrOptions,
        true,
      );
      sourceFileCache.set(normalizedFileName, sourceFile);
      return sourceFile;
    },
    readDirectory: virtualFileSystem.readDirectory,
    readFile: virtualFileSystem.readFile,
    realpath: normalizeAbsolutePath,
    useCaseSensitiveFileNames: () => true,
    writeFile: () => {},
  };

  const selected = selectedFileNames
    ? new Set(selectedFileNames.map(normalizeRelativeFileName))
    : null;
  const selectedProgramRoots = files
    .filter(({ fileName }) => isProjectTextFile(fileName))
    .filter(({ fileName }) => getAnalyzerLanguage(fileName) !== null)
    .filter(({ fileName }) =>
      selected ? selected.has(normalizeRelativeFileName(fileName)) : true,
    )
    .map(({ fileName }) => toProjectPath(fileName));
  const projectTsconfigFileNames = getProjectTsconfigFiles(files);
  const declarationRoots = files
    .filter(({ fileName }) => /\.d\.(?:c|m)?ts$/i.test(fileName))
    .filter(
      ({ fileName }) =>
        findNearestTsconfig(fileName, projectTsconfigFileNames) ===
        tsconfigFileName,
    )
    .map(({ fileName }) => toProjectPath(fileName));
  const programRootNames = [
    ...new Set([...selectedProgramRoots, ...declarationRoots]),
  ].sort((left, right) => left.localeCompare(right));
  const program = ts.createProgram(
    programRootNames,
    compilerOptions,
    compilerHost,
  );
  const inputs = files.flatMap(({ fileName }) => {
    const language = getAnalyzerLanguage(fileName);
    const normalizedFileName = normalizeRelativeFileName(fileName);
    if (
      !language ||
      /\.d\.(?:c|m)?ts$/i.test(fileName) ||
      (selected && !selected.has(normalizedFileName))
    ) {
      return [];
    }

    const projectFileName = toProjectPath(fileName);
    if (!program.getSourceFile(projectFileName)) {
      return [];
    }

    return [
      { fileName: projectFileName, language } satisfies ProgramAnalyzeInput,
    ];
  });

  return {
    configurationDiagnostics,
    inputs,
    program,
    tsconfigFileName: tsconfigFileName ?? null,
  };
};

export const toDisplayFileName = (fileName: string) => {
  const prefix = `${projectRoot}/`;
  return fileName.startsWith(prefix) ? fileName.slice(prefix.length) : fileName;
};

export interface VirtualProjectPlan {
  fileNames: readonly string[];
  tsconfigFileName?: string;
}

export interface VirtualProjectPlanOptions {
  shouldAnalyzeFile?: (fileName: string) => boolean;
  tsconfig?: string | false;
}

export const createVirtualProjectPlans = (
  files: readonly BrowserProjectFile[],
  options: VirtualProjectPlanOptions = {},
): readonly VirtualProjectPlan[] => {
  const tsconfigFileNames = getProjectTsconfigFiles(files);
  const configuredTsconfig =
    typeof options.tsconfig === "string"
      ? normalizeRelativeFileName(options.tsconfig)
      : undefined;
  const groups = new Map<string | undefined, string[]>();

  for (const { fileName } of files) {
    const language = getAnalyzerLanguage(fileName);
    if (!language || /\.d\.(?:c|m)?ts$/i.test(fileName)) {
      continue;
    }

    const normalizedFileName = normalizeRelativeFileName(fileName);
    if (options.shouldAnalyzeFile?.(normalizedFileName) === false) {
      continue;
    }

    const tsconfigFileName =
      options.tsconfig === false
        ? undefined
        : (configuredTsconfig ??
          findNearestTsconfig(normalizedFileName, tsconfigFileNames));
    const group = groups.get(tsconfigFileName);
    if (group) {
      group.push(normalizedFileName);
    } else {
      groups.set(tsconfigFileName, [normalizedFileName]);
    }
  }

  return [...groups.entries()]
    .sort(([left], [right]) => String(left).localeCompare(String(right)))
    .map(([tsconfigFileName, fileNames]) => ({
      fileNames: fileNames.sort((left, right) => left.localeCompare(right)),
      ...(tsconfigFileName ? { tsconfigFileName } : {}),
    }));
};
