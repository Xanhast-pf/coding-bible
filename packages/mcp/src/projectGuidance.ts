import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import {
  buildRuleSetAgentPrompt,
  rulePackGroups,
  rulePackLabels,
  rules,
  type RulePack,
} from "@coding-bible/rules";

import { codingBibleCanonicalUrl } from "./constants.ts";
import { resolveInsideRoot, toRootRelativePath } from "./pathSafety.ts";

const ignoredDirectories = new Set([
  ".cache",
  ".git",
  ".next",
  ".turbo",
  ".vite",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "vendor",
]);

const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
] as const;

interface ProjectManifest {
  dependencies?: Readonly<Record<string, string>>;
  devDependencies?: Readonly<Record<string, string>>;
  optionalDependencies?: Readonly<Record<string, string>>;
  peerDependencies?: Readonly<Record<string, string>>;
}

interface EcosystemDetector {
  pack: Extract<
    RulePack,
    | "apollo"
    | "graphql"
    | "legend-state"
    | "nextjs"
    | "react"
    | "redux"
    | "tanstack-query"
  >;
  packages: readonly string[];
  implies?: readonly RulePack[];
}

const ecosystemDetectors: readonly EcosystemDetector[] = [
  {
    pack: "react",
    packages: ["react", "react-dom"],
  },
  {
    pack: "legend-state",
    packages: ["@legendapp/state"],
  },
  {
    pack: "redux",
    packages: ["@reduxjs/toolkit", "react-redux", "redux"],
  },
  {
    pack: "graphql",
    packages: [
      "@urql/core",
      "graphql",
      "graphql-request",
      "graphql-tag",
      "urql",
    ],
  },
  {
    pack: "apollo",
    packages: ["@apollo/client", "apollo-client"],
    implies: ["graphql"],
  },
  {
    pack: "tanstack-query",
    packages: [
      "@tanstack/query-core",
      "@tanstack/react-query",
      "@tanstack/solid-query",
      "@tanstack/svelte-query",
      "@tanstack/vue-query",
    ],
  },
  {
    pack: "nextjs",
    packages: ["next"],
    implies: ["react"],
  },
];

export interface DetectedEcosystem {
  evidence: readonly string[];
  label: string;
  pack: RulePack;
}

export interface ProjectGuidanceResult {
  schemaVersion: 1;
  kind: "project-guidance";
  projectRoot: string;
  manifests: readonly string[];
  detectedEcosystems: readonly DetectedEcosystem[];
  selectedPacks: readonly RulePack[];
  ruleCount: number;
  ruleIds: readonly string[];
  guidance: string;
  warnings: readonly string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) &&
  Object.values(value).every((item) => typeof item === "string");

const parseManifest = (value: unknown, filePath: string): ProjectManifest => {
  if (!isRecord(value)) {
    throw new Error(`Expected an object in ${filePath}.`);
  }

  const manifest: ProjectManifest = {};

  for (const section of dependencySections) {
    const candidate = value[section];
    if (candidate === undefined) {
      continue;
    }
    if (!isStringRecord(candidate)) {
      throw new Error(`Expected ${section} to be a string map in ${filePath}.`);
    }
    manifest[section] = candidate;
  }

  return manifest;
};

const collectManifestPaths = async (
  rootDirectory: string,
  { maxDepth = 8, maxManifests = 256 } = {},
) => {
  const manifests: string[] = [];

  const visit = async (directory: string, depth: number): Promise<void> => {
    if (depth > maxDepth || manifests.length >= maxManifests) {
      return;
    }

    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      if (manifests.length >= maxManifests) {
        return;
      }

      const candidate = path.join(directory, entry.name);

      if (entry.isFile() && entry.name === "package.json") {
        manifests.push(candidate);
        continue;
      }

      if (
        entry.isDirectory() &&
        !ignoredDirectories.has(entry.name) &&
        !entry.name.startsWith(".")
      ) {
        await visit(candidate, depth + 1);
      }
    }
  };

  await visit(rootDirectory, 0);
  return manifests;
};

const collectDependencyNames = (manifests: readonly ProjectManifest[]) => {
  const dependencies = new Set<string>();

  for (const manifest of manifests) {
    for (const section of dependencySections) {
      Object.keys(manifest[section] ?? {}).forEach((dependency) =>
        dependencies.add(dependency),
      );
    }
  }

  return dependencies;
};

const detectEcosystems = (dependencies: ReadonlySet<string>) => {
  const evidenceByPack = new Map<RulePack, Set<string>>();

  for (const detector of ecosystemDetectors) {
    const evidence = detector.packages.filter((dependency) =>
      dependencies.has(dependency),
    );

    if (!evidence.length) {
      continue;
    }

    evidenceByPack.set(detector.pack, new Set(evidence));

    for (const impliedPack of detector.implies ?? []) {
      const impliedEvidence =
        evidenceByPack.get(impliedPack) ?? new Set<string>();
      evidence.forEach((dependency) => impliedEvidence.add(dependency));
      evidenceByPack.set(impliedPack, impliedEvidence);
    }
  }

  return [...evidenceByPack.entries()]
    .map(([pack, evidence]) => ({
      evidence: [...evidence].sort((left, right) => left.localeCompare(right)),
      label: rulePackLabels[pack],
      pack,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
};

const resolveProjectDirectory = async (
  serverRoot: string,
  requestedPath: string,
) => {
  const requested = resolveInsideRoot(
    serverRoot,
    requestedPath,
    "Project path",
  );
  const details = await stat(requested);

  if (details.isDirectory()) {
    return requested;
  }

  if (details.isFile() && path.basename(requested) === "package.json") {
    return path.dirname(requested);
  }

  throw new Error("Project path must be a directory or package.json file.");
};

export const getProjectGuidance = async (
  {
    path: requestedPath = ".",
  }: {
    path?: string;
  },
  {
    canonicalBaseUrl = codingBibleCanonicalUrl,
    rootDirectory = process.cwd(),
  } = {},
): Promise<ProjectGuidanceResult> => {
  const projectDirectory = await resolveProjectDirectory(
    rootDirectory,
    requestedPath,
  );
  const manifestPaths = await collectManifestPaths(projectDirectory);
  const warnings: string[] = [];
  const manifests: ProjectManifest[] = [];

  for (const manifestPath of manifestPaths) {
    try {
      manifests.push(
        parseManifest(
          JSON.parse(await readFile(manifestPath, "utf8")) as unknown,
          toRootRelativePath(projectDirectory, manifestPath),
        ),
      );
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? error.message
          : `Could not read ${toRootRelativePath(projectDirectory, manifestPath)}.`,
      );
    }
  }

  const detectedEcosystems = detectEcosystems(
    collectDependencyNames(manifests),
  );
  const detectedPacks = new Set(detectedEcosystems.map(({ pack }) => pack));
  const selectedRules = rules.filter(
    (rule) =>
      rule.status === "stable" &&
      (rulePackGroups[rule.pack] !== "ecosystem" ||
        detectedPacks.has(rule.pack)),
  );
  const selectedPacks = [
    ...new Set(selectedRules.map((rule) => rule.pack)),
  ].sort((left, right) =>
    rulePackLabels[left].localeCompare(rulePackLabels[right]),
  );

  return {
    schemaVersion: 1,
    kind: "project-guidance",
    projectRoot: toRootRelativePath(rootDirectory, projectDirectory),
    manifests: manifestPaths.map((manifestPath) =>
      toRootRelativePath(projectDirectory, manifestPath),
    ),
    detectedEcosystems,
    selectedPacks,
    ruleCount: selectedRules.length,
    ruleIds: selectedRules.map((rule) => rule.id),
    guidance: buildRuleSetAgentPrompt(selectedRules, canonicalBaseUrl),
    warnings,
  };
};
