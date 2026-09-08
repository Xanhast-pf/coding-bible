const contextLines = 3;
export const normalizeAnalyzerPatchPath = (filePath) => filePath.replaceAll("\\", "/");
export const applyAnalyzerTextEdits = (source, edits) => {
    let output = source;
    for (const edit of [...edits].sort((left, right) => right.start - left.start)) {
        output = `${output.slice(0, edit.start)}${edit.replacement}${output.slice(edit.end)}`;
    }
    return output;
};
const getLineStarts = (source) => {
    const starts = [0];
    for (let index = 0; index < source.length; index += 1) {
        if (source[index] === "\n") {
            starts.push(index + 1);
        }
    }
    return starts;
};
const lineIndexAt = (starts, offset) => {
    let low = 0;
    let high = starts.length - 1;
    let result = 0;
    while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        const start = starts[middle];
        if (start !== undefined && start <= offset) {
            result = middle;
            low = middle + 1;
        }
        else {
            high = middle - 1;
        }
    }
    return result;
};
const splitPatchLines = (value) => {
    const normalized = value.replaceAll("\r\n", "\n");
    const hasFinalNewline = normalized.endsWith("\n");
    const lines = normalized.split("\n");
    if (hasFinalNewline) {
        lines.pop();
    }
    return { hasFinalNewline, lines };
};
const diffLines = (oldLines, newLines) => {
    const rows = oldLines.length + 1;
    const columns = newLines.length + 1;
    const table = Array.from({ length: rows }, () => new Uint16Array(columns));
    for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
        for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
            const row = table[oldIndex];
            const nextRow = table[oldIndex + 1];
            if (!row || !nextRow) {
                continue;
            }
            row[newIndex] =
                oldLines[oldIndex] === newLines[newIndex]
                    ? (nextRow[newIndex + 1] ?? 0) + 1
                    : Math.max(row[newIndex + 1] ?? 0, nextRow[newIndex] ?? 0);
        }
    }
    const operations = [];
    let oldIndex = 0;
    let newIndex = 0;
    while (oldIndex < oldLines.length || newIndex < newLines.length) {
        if (oldIndex < oldLines.length &&
            newIndex < newLines.length &&
            oldLines[oldIndex] === newLines[newIndex]) {
            operations.push({
                kind: "context",
                line: oldLines[oldIndex] ?? "",
                oldIndex,
                newIndex,
            });
            oldIndex += 1;
            newIndex += 1;
            continue;
        }
        const row = table[oldIndex];
        const nextRow = table[oldIndex + 1];
        if (newIndex < newLines.length &&
            (oldIndex === oldLines.length ||
                (row?.[newIndex + 1] ?? 0) > (nextRow?.[newIndex] ?? 0))) {
            operations.push({
                kind: "add",
                line: newLines[newIndex] ?? "",
                newIndex,
            });
            newIndex += 1;
            continue;
        }
        operations.push({
            kind: "remove",
            line: oldLines[oldIndex] ?? "",
            oldIndex,
        });
        oldIndex += 1;
    }
    return operations;
};
const groupEdits = (source, edits) => {
    const lineStarts = getLineStarts(source);
    const groups = [];
    for (const edit of edits) {
        const startLine = lineIndexAt(lineStarts, edit.start);
        const endOffset = edit.end > edit.start ? edit.end - 1 : edit.start;
        const endLine = lineIndexAt(lineStarts, Math.min(endOffset, source.length));
        const previous = groups.at(-1);
        if (previous && startLine <= previous.endLine + contextLines * 2 + 1) {
            previous.edits.push(edit);
            previous.endLine = Math.max(previous.endLine, endLine);
            continue;
        }
        groups.push({ edits: [edit], endLine, startLine });
    }
    return { groups, lineStarts };
};
const createHunks = (source, edits) => {
    const { groups, lineStarts } = groupEdits(source, edits);
    const sourceLines = splitPatchLines(source);
    const hunks = [];
    let lineDelta = 0;
    for (const group of groups) {
        const oldStartLine = Math.max(0, group.startLine - contextLines);
        const oldEndLine = Math.min(sourceLines.lines.length, group.endLine + contextLines + 1);
        const sliceStart = lineStarts[oldStartLine] ?? 0;
        const sliceEnd = lineStarts[oldEndLine] ?? source.length;
        const oldSlice = source.slice(sliceStart, sliceEnd);
        const relativeEdits = group.edits.map((edit) => ({
            ...edit,
            end: edit.end - sliceStart,
            start: edit.start - sliceStart,
        }));
        const newSlice = applyAnalyzerTextEdits(oldSlice, relativeEdits);
        const oldSegment = splitPatchLines(oldSlice);
        const newSegment = splitPatchLines(newSlice);
        const operations = diffLines(oldSegment.lines, newSegment.lines);
        const lines = [];
        for (const operation of operations) {
            const prefix = operation.kind === "add"
                ? "+"
                : operation.kind === "remove"
                    ? "-"
                    : " ";
            lines.push(`${prefix}${operation.line}`);
            const oldIsFinal = "oldIndex" in operation &&
                operation.oldIndex === oldSegment.lines.length - 1 &&
                oldEndLine === sourceLines.lines.length &&
                !sourceLines.hasFinalNewline;
            const newIsFinal = "newIndex" in operation &&
                operation.newIndex === newSegment.lines.length - 1 &&
                oldEndLine === sourceLines.lines.length &&
                !newSegment.hasFinalNewline;
            if ((operation.kind !== "add" && oldIsFinal) ||
                (operation.kind !== "remove" && newIsFinal)) {
                lines.push("\\ No newline at end of file");
            }
        }
        hunks.push(`@@ -${oldStartLine + 1},${oldSegment.lines.length} +${oldStartLine + 1 + lineDelta},${newSegment.lines.length} @@\n${lines.join("\n")}`);
        lineDelta += newSegment.lines.length - oldSegment.lines.length;
    }
    return hunks;
};
const assertValidEdit = (edit, source, filePath) => {
    if (!Number.isInteger(edit.start) ||
        !Number.isInteger(edit.end) ||
        edit.start < 0 ||
        edit.end < edit.start ||
        edit.end > source.length) {
        throw new Error(`Invalid analyzer fix range for ${filePath}.`);
    }
};
export const prepareAnalyzerTextEdits = (source, edits, filePath) => {
    const deduped = new Map();
    for (const edit of edits) {
        assertValidEdit(edit, source, filePath);
        deduped.set(`${edit.start}:${edit.end}:${edit.replacement}`, edit);
    }
    const prepared = [...deduped.values()].sort((left, right) => left.start - right.start || left.end - right.end);
    for (let index = 1; index < prepared.length; index += 1) {
        const previous = prepared[index - 1];
        const current = prepared[index];
        if (previous &&
            current &&
            (current.start < previous.end ||
                (current.start === previous.start && current.end === previous.end))) {
            throw new Error(`Conflicting analyzer fixes overlap in ${filePath}.`);
        }
    }
    return prepared;
};
export const createAnalyzerFilePatch = (filePath, source, edits) => {
    const prepared = prepareAnalyzerTextEdits(source, edits, filePath);
    if (!prepared.length) {
        return "";
    }
    const patchPath = normalizeAnalyzerPatchPath(filePath);
    const hunks = createHunks(source, prepared);
    return [
        `diff --git a/${patchPath} b/${patchPath}`,
        `--- a/${patchPath}`,
        `+++ b/${patchPath}`,
        ...hunks,
    ].join("\n");
};
