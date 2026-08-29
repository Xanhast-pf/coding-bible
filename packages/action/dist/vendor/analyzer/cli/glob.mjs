import path from "node:path";

export const normalizePath = (value) =>
  value.split(path.sep).join("/").replace(/^\.\//, "");

export const expandBraces = (pattern) => {
  const match = /\{([^{}]+)\}/.exec(pattern);
  if (!match) {
    return [pattern];
  }

  const [token, body] = match;
  const parts = body.split(",");

  return parts.flatMap((part) => expandBraces(pattern.replace(token, part)));
};

const escapeRegex = (character) =>
  /[\\^$+?.()|[\]{}]/.test(character) ? `\\${character}` : character;

export const globToRegExp = (inputPattern) => {
  const pattern = normalizePath(inputPattern);
  let source = "^";

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    const next = pattern[index + 1];

    if (character === "*" && next === "*") {
      const after = pattern[index + 2];
      if (after === "/") {
        source += "(?:.*/)?";
        index += 2;
      } else {
        source += ".*";
        index += 1;
      }
      continue;
    }

    if (character === "*") {
      source += "[^/]*";
      continue;
    }

    if (character === "?") {
      source += "[^/]";
      continue;
    }

    source += escapeRegex(character);
  }

  source += "$";
  return new RegExp(source);
};

export const compileGlobs = (patterns = []) =>
  patterns.flatMap(expandBraces).map(globToRegExp);

export const matchesAnyGlob = (filePath, compiledPatterns) => {
  const normalized = normalizePath(filePath);
  return compiledPatterns.some((pattern) => pattern.test(normalized));
};
