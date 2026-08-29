const hunkPattern = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/u;

const normalizePath = (value) =>
  value.replaceAll("\\", "/").replace(/^\.\//u, "");

const readDiffPath = (line) => {
  const raw = line.slice(4).trimEnd();
  if (raw === "/dev/null") {
    return null;
  }
  if (raw.startsWith('"')) {
    throw new Error(
      "Quoted Git paths are not supported. Coding Bible runs Git with core.quotePath=false; provide an unquoted diff when testing directly.",
    );
  }
  return normalizePath(raw.startsWith("b/") ? raw.slice(2) : raw);
};

const toRanges = (lines) => {
  const ranges = [];
  for (const line of lines) {
    const previous = ranges.at(-1);
    if (previous && previous.endLine + 1 === line) {
      previous.endLine = line;
    } else {
      ranges.push({ startLine: line, endLine: line });
    }
  }
  return ranges;
};

export const parseGitDiff = (diff) => {
  const changedLinesByFile = new Map();
  let currentFile = null;
  let currentLine = 0;
  let inHunk = false;

  for (const line of diff.split(/\r?\n/u)) {
    if (!inHunk && line.startsWith("+++ ")) {
      currentFile = readDiffPath(line);
      if (currentFile) {
        changedLinesByFile.set(
          currentFile,
          changedLinesByFile.get(currentFile) ?? [],
        );
      }
      continue;
    }

    const hunk = hunkPattern.exec(line);
    if (hunk) {
      currentLine = Number(hunk[1]);
      inHunk = Boolean(currentFile);
      continue;
    }

    if (!inHunk || !currentFile) {
      continue;
    }

    if (line.startsWith("+")) {
      changedLinesByFile.get(currentFile)?.push(currentLine);
      currentLine += 1;
      continue;
    }
    if (line.startsWith("-")) {
      continue;
    }
    if (line.startsWith(" ")) {
      currentLine += 1;
      continue;
    }
    if (!line.startsWith("\\")) {
      inHunk = false;
    }
  }

  return [...changedLinesByFile.entries()]
    .map(([file, lines]) => ({ file, ranges: toRanges(lines) }))
    .sort((left, right) => left.file.localeCompare(right.file));
};

export const locationTouchesRanges = (location, ranges) =>
  ranges.some(
    ({ startLine, endLine }) =>
      location.line <= endLine && location.endLine >= startLine,
  );

export const filterChangedLocations = (items, changes) => {
  const rangesByFile = new Map(
    changes.map(({ file, ranges }) => [normalizePath(file), ranges]),
  );
  return items.filter((item) => {
    const ranges = rangesByFile.get(normalizePath(item.filePath));
    return ranges ? locationTouchesRanges(item.location, ranges) : false;
  });
};
