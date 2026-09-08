import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const actionDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const distDirectory = path.join(actionDirectory, "dist");

const walkModuleFiles = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkModuleFiles(absolutePath)));
    } else if (entry.name.endsWith(".mjs")) {
      files.push(absolutePath);
    }
  }
  return files;
};

const collectImportSpecifiers = (source) => {
  const specifiers = [];
  const staticPattern =
    /^\s*(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/gmu;
  const dynamicPattern = /\bimport\(\s*["']([^"']+)["']\s*\)/gu;

  for (const match of source.matchAll(staticPattern)) {
    specifiers.push(match[1]);
  }
  for (const match of source.matchAll(dynamicPattern)) {
    specifiers.push(match[1]);
  }
  return specifiers;
};

const isInside = (parent, candidate) => {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

test("committed Action runtime is self-contained", async () => {
  const violations = [];

  for (const modulePath of await walkModuleFiles(distDirectory)) {
    const source = await readFile(modulePath, "utf8");
    for (const specifier of collectImportSpecifiers(source)) {
      if (specifier.startsWith("node:")) {
        continue;
      }
      if (!specifier.startsWith(".")) {
        violations.push(
          `${path.relative(distDirectory, modulePath)} has bare import ${specifier}`,
        );
        continue;
      }

      const resolvedPath = path.resolve(path.dirname(modulePath), specifier);
      if (!isInside(distDirectory, resolvedPath)) {
        violations.push(
          `${path.relative(distDirectory, modulePath)} escapes dist via ${specifier}`,
        );
        continue;
      }

      try {
        await access(resolvedPath);
      } catch {
        violations.push(
          `${path.relative(distDirectory, modulePath)} imports missing ${specifier}`,
        );
      }
    }
  }

  assert.deepEqual(violations, []);
});
