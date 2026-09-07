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

/** Lexical containment check. Use resolveExistingInsideRoot before reading files. */
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

/**
 * Resolves the actual filesystem target and rejects symlink escapes. The MCP
 * root is expected to be canonical (resolveRootDirectory does this), but this
 * function also canonicalizes it so direct library callers get the same guard.
 */
export const resolveExistingInsideRoot = async (
  rootDirectory: string,
  value: string,
  label: string,
) => {
  const canonicalRoot = await realpath(path.resolve(rootDirectory));
  const lexicalTarget = resolveInsideRoot(canonicalRoot, value, label);
  let resolvedTarget: string;

  try {
    resolvedTarget = await realpath(lexicalTarget);
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    throw new Error(
      `${label} could not be resolved inside the MCP root.${detail}`,
    );
  }

  if (!isInside(canonicalRoot, resolvedTarget)) {
    throw new Error(`${label} must stay inside the configured MCP root.`);
  }

  return resolvedTarget;
};

export const toRootRelativePath = (rootDirectory: string, value: string) => {
  const relative = path.relative(rootDirectory, value);

  return relative === "" ? "." : relative.replaceAll("\\", "/");
};
