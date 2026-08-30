export const normalizeGlobPath = (value) => value.replaceAll("\\", "/").replace(/^\.\//, "");
export const expandGlobBraces = (pattern) => {
    const match = /\{([^{}]+)\}/.exec(pattern);
    if (!match) {
        return [pattern];
    }
    const token = match[0];
    const body = match[1];
    if (!token || body === undefined) {
        return [pattern];
    }
    const parts = body.split(",");
    return parts.flatMap((part) => expandGlobBraces(pattern.replace(token, part)));
};
const escapeRegex = (character) => /[\\^$+?.()|[\]{}]/.test(character) ? `\\${character}` : character;
export const globToRegExp = (inputPattern) => {
    const pattern = normalizeGlobPath(inputPattern);
    let source = "^";
    for (let index = 0; index < pattern.length; index += 1) {
        const character = pattern[index];
        const next = pattern[index + 1];
        if (character === "*" && next === "*") {
            const after = pattern[index + 2];
            if (after === "/") {
                source += "(?:.*/)?";
                index += 2;
            }
            else {
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
        if (character) {
            source += escapeRegex(character);
        }
    }
    source += "$";
    return new RegExp(source);
};
export const compileGlobs = (patterns = []) => patterns.flatMap(expandGlobBraces).map(globToRegExp);
export const matchesAnyGlob = (filePath, compiledPatterns) => {
    const normalized = normalizeGlobPath(filePath);
    return compiledPatterns.some((pattern) => pattern.test(normalized));
};
