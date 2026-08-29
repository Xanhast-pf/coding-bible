import { realpath, stat } from "node:fs/promises";
import path from "node:path";

const isInside = (parent: string, candidate: string) => {
  const relative = path.relative(parent, candidate);

  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

export const resolveRootDirectory = async (value: string) => {
  const resolved = await realpath(path.resolve(value));
  const details = await stat(resolved);

  if (!details.isDirectory()) {
    throw new Error(`MCP root must be a directory: ${value}`);
  }

  return resolved;
};

export const resolveInsideRoot = (
  rootDirectory: string,
  value: string,
  label: string,
) => {
  const resolved = path.resolve(rootDirectory, value);

  if (!isInside(rootDirectory, resolved)) {
    throw new Error(`${label} must stay inside the configured MCP root.`);
  }

  return resolved;
};

export const toRootRelativePath = (rootDirectory: string, value: string) => {
  const relative = path.relative(rootDirectory, value);

  return relative === "" ? "." : relative.replaceAll("\\", "/");
};
