import { realpath, stat } from "node:fs/promises";
import path from "node:path";

import ts from "typescript";

import { expandBraces } from "./glob.mjs";

export const languageByExtension = new Map([
  [".css", "css"],
  [".gql", "graphql"],
  [".graphql", "graphql"],
  [".cjs", "js"],
  [".cts", "ts"],
  [".js", "js"],
  [".jsx", "jsx"],
  [".mjs", "js"],
  [".mts", "ts"],
  [".ts", "ts"],
  [".tsx", "tsx"],
]);

const supportedExtensions = [...languageByExtension.keys()];

const normalizeTargets = (targets) => (targets.length ? targets : ["."]);

const isInsideBoundary = (parent, candidate) => {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

const enforceFileBoundary = async (files, boundaryRoot) => {
  if (!boundaryRoot) {
    return files;
  }

  const resolvedBoundary = await realpath(path.resolve(boundaryRoot));
  for (const filePath of files) {
    const resolvedFile = await realpath(filePath);
    if (!isInsideBoundary(resolvedBoundary, resolvedFile)) {
      throw new Error(
        `Discovered source file escapes the configured analysis boundary: ${filePath}`,
      );
    }
  }
  return files;
};

const getTargetMatchers = async (targets, cwd, boundaryRoot) => {
  const matchers = [];

  const resolvedBoundary = boundaryRoot
    ? await realpath(path.resolve(boundaryRoot))
    : null;

  for (const target of normalizeTargets(targets)) {
    const absolutePath = path.resolve(cwd, target);
    let targetStat;
    try {
      targetStat = await stat(absolutePath);
    } catch {
      throw new Error(`Requested path does not exist: ${target}`);
    }

    if (resolvedBoundary) {
      const resolvedTarget = await realpath(absolutePath);
      if (!isInsideBoundary(resolvedBoundary, resolvedTarget)) {
        throw new Error(
          `Requested path escapes the configured analysis boundary: ${target}`,
        );
      }
    }

    if (targetStat.isDirectory()) {
      const prefix = absolutePath.endsWith(path.sep)
        ? absolutePath
        : `${absolutePath}${path.sep}`;
      matchers.push(
        (candidate) =>
          candidate === absolutePath || candidate.startsWith(prefix),
      );
      continue;
    }

    if (targetStat.isFile()) {
      matchers.push((candidate) => candidate === absolutePath);
    }
  }

  return matchers;
};

export const discoverSourceFiles = async (
  targets,
  { boundaryRoot, cwd = process.cwd(), config, scopedFiles = null } = {},
) => {
  const startedAt = performance.now();
  const include = (config.include ?? ["**/*"]).flatMap(expandBraces);
  const exclude = (config.ignore ?? []).flatMap(expandBraces);
  const targetMatchers = await getTargetMatchers(targets, cwd, boundaryRoot);

  const allDiscovered = ts.sys
    .readDirectory(cwd, supportedExtensions, exclude, include)
    .map((filePath) => path.resolve(filePath))
    .sort((left, right) => left.localeCompare(right));
  const discovered = allDiscovered.filter((filePath) =>
    targetMatchers.some((matches) => matches(filePath)),
  );
  const selected = scopedFiles
    ? discovered.filter((filePath) => scopedFiles.has(filePath))
    : discovered;
  const boundaryChecked = await enforceFileBoundary(selected, boundaryRoot);

  return {
    discovered,
    files: boundaryChecked,
    discoveryMs: performance.now() - startedAt,
  };
};

const formatTsDiagnostics = (diagnostics, cwd) =>
  ts.formatDiagnostics(diagnostics, {
    getCanonicalFileName: (fileName) =>
      path.relative(cwd, fileName) || fileName,
    getCurrentDirectory: () => cwd,
    getNewLine: () => "\n",
  });

const defaultCompilerOptions = {
  allowJs: true,
  checkJs: false,
  jsx: ts.JsxEmit.Preserve,
  noEmit: true,
  strict: true,
  target: ts.ScriptTarget.ES2022,
};

const loadTsConfig = (cwd, configPath) => {
  if (!configPath) {
    return {
      configPath: null,
      fileNames: [],
      options: defaultCompilerOptions,
      projectReferences: [],
    };
  }

  const loaded = ts.readConfigFile(configPath, ts.sys.readFile);
  if (loaded.error) {
    throw new Error(formatTsDiagnostics([loaded.error], cwd));
  }

  const parsed = ts.parseJsonConfigFileContent(
    loaded.config,
    ts.sys,
    path.dirname(configPath),
    undefined,
    configPath,
  );
  if (parsed.errors.length) {
    throw new Error(formatTsDiagnostics(parsed.errors, cwd));
  }

  return {
    configPath,
    fileNames: parsed.fileNames.map((fileName) => path.resolve(fileName)),
    options: {
      ...parsed.options,
      allowJs: true,
      noEmit: true,
    },
    projectReferences: parsed.projectReferences ?? [],
  };
};

const isInside = (parent, candidate) => {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

const createNearestTsconfigFinder = (cwd) => {
  const cache = new Map();

  return (filePath) => {
    const visited = [];
    let directory = path.dirname(filePath);

    while (isInside(cwd, directory)) {
      if (cache.has(directory)) {
        const cached = cache.get(directory) ?? null;
        for (const visitedDirectory of visited) {
          cache.set(visitedDirectory, cached);
        }
        return cached;
      }

      visited.push(directory);
      const candidate = path.join(directory, "tsconfig.json");
      if (ts.sys.fileExists(candidate)) {
        for (const visitedDirectory of visited) {
          cache.set(visitedDirectory, candidate);
        }
        return candidate;
      }

      if (directory === cwd) {
        break;
      }
      directory = path.dirname(directory);
    }

    for (const visitedDirectory of visited) {
      cache.set(visitedDirectory, null);
    }
    return null;
  };
};

const groupFilesByProject = (selectedFiles, cwd, tsconfig) => {
  if (tsconfig === false) {
    return new Map([[null, selectedFiles]]);
  }

  if (typeof tsconfig === "string") {
    return new Map([[path.resolve(cwd, tsconfig), selectedFiles]]);
  }

  const groups = new Map();
  const findNearestTsconfig = createNearestTsconfigFinder(cwd);
  for (const filePath of selectedFiles) {
    const configPath = findNearestTsconfig(filePath);
    const files = groups.get(configPath);
    if (files) {
      files.push(filePath);
    } else {
      groups.set(configPath, [filePath]);
    }
  }

  return groups;
};

export const createProjectPlans = (
  selectedFiles,
  { cwd = process.cwd(), tsconfig } = {},
) => {
  const groups = groupFilesByProject(selectedFiles, cwd, tsconfig);

  return [...groups.entries()]
    .sort(([left], [right]) => String(left).localeCompare(String(right)))
    .map(([configPath, files]) => ({ configPath, files }));
};

export const prepareProjectPlan = (plan, { cwd = process.cwd() } = {}) => {
  const project = loadTsConfig(cwd, plan.configPath);
  const rootNames = [...new Set([...project.fileNames, ...plan.files])].sort(
    (left, right) => left.localeCompare(right),
  );

  return {
    files: plan.files,
    options: project.options,
    projectReferences: project.projectReferences,
    rootNames,
    tsconfigPath: project.configPath,
  };
};

export const createProjectProgram = (project) => {
  const startedAt = performance.now();
  const program = ts.createProgram({
    options: project.options,
    projectReferences: project.projectReferences,
    rootNames: project.rootNames,
  });

  return {
    ...project,
    program,
    programMs: performance.now() - startedAt,
    projectFiles: project.rootNames.length,
  };
};

export const createSourceFileProgram = (project, fileNames) => {
  const startedAt = performance.now();
  const program = ts.createProgram({
    options: {
      ...project.options,
      noResolve: true,
    },
    rootNames: fileNames,
  });

  return {
    ...project,
    program,
    programMs: performance.now() - startedAt,
    projectFiles: fileNames.length,
  };
};
