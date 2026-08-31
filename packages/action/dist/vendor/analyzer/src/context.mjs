import ts from "../../typescript/typescript.cjs";
const scriptKindByLanguage = {
    js: ts.ScriptKind.JS,
    jsx: ts.ScriptKind.JSX,
    ts: ts.ScriptKind.TS,
    tsx: ts.ScriptKind.TSX,
};
const compilerOptions = {
    allowJs: true,
    checkJs: false,
    jsx: ts.JsxEmit.Preserve,
    noLib: true,
    noResolve: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
};
const buildProgram = (inputs) => {
    const inputsByFileName = new Map(inputs.map((input) => [input.fileName, input]));
    const sourceFiles = new Map(inputs.map((input) => [
        input.fileName,
        ts.createSourceFile(input.fileName, input.source, ts.ScriptTarget.Latest, true, scriptKindByLanguage[input.language]),
    ]));
    const host = {
        fileExists: (candidate) => inputsByFileName.has(candidate),
        getCanonicalFileName: (candidate) => candidate,
        getCurrentDirectory: () => "",
        getDefaultLibFileName: () => "lib.d.ts",
        getNewLine: () => "\n",
        getSourceFile: (candidate) => sourceFiles.get(candidate),
        readFile: (candidate) => inputsByFileName.get(candidate)?.source,
        useCaseSensitiveFileNames: () => true,
        writeFile: () => { },
    };
    return ts.createProgram(inputs.map(({ fileName }) => fileName), compilerOptions, host);
};
const getImportBinding = (node, checker) => {
    const parent = node.parent;
    if (ts.isImportSpecifier(parent) && parent.name === node) {
        const declaration = parent.parent.parent.parent;
        if (!ts.isImportDeclaration(declaration) ||
            !ts.isStringLiteral(declaration.moduleSpecifier)) {
            return null;
        }
        return {
            importedName: parent.propertyName?.text ?? parent.name.text,
            isTypeOnly: parent.isTypeOnly || parent.parent.parent.isTypeOnly,
            kind: "named",
            local: node,
            moduleName: declaration.moduleSpecifier.text,
            symbol: checker.getSymbolAtLocation(node) ?? null,
        };
    }
    if (ts.isNamespaceImport(parent) && parent.name === node) {
        const declaration = parent.parent.parent;
        if (!ts.isImportDeclaration(declaration) ||
            !ts.isStringLiteral(declaration.moduleSpecifier)) {
            return null;
        }
        return {
            importedName: "*",
            isTypeOnly: parent.parent.isTypeOnly,
            kind: "namespace",
            local: node,
            moduleName: declaration.moduleSpecifier.text,
            symbol: checker.getSymbolAtLocation(node) ?? null,
        };
    }
    if (ts.isImportClause(parent) && parent.name === node) {
        const declaration = parent.parent;
        if (!ts.isImportDeclaration(declaration) ||
            !ts.isStringLiteral(declaration.moduleSpecifier)) {
            return null;
        }
        return {
            importedName: "default",
            isTypeOnly: parent.isTypeOnly,
            kind: "default",
            local: node,
            moduleName: declaration.moduleSpecifier.text,
            symbol: checker.getSymbolAtLocation(node) ?? null,
        };
    }
    return null;
};
const buildContext = (input, program, checker) => {
    const sourceFile = program.getSourceFile(input.fileName);
    if (!sourceFile) {
        throw new Error(`Analyzer could not bind ${input.fileName}.`);
    }
    const importsBySymbol = new Map();
    const nodesByKind = new Map();
    const identifiersByText = new Map();
    const walk = (node) => {
        const bucket = nodesByKind.get(node.kind);
        if (bucket) {
            bucket.push(node);
        }
        else {
            nodesByKind.set(node.kind, [node]);
        }
        if (ts.isIdentifier(node)) {
            const identifiers = identifiersByText.get(node.text);
            if (identifiers) {
                identifiers.push(node);
            }
            else {
                identifiersByText.set(node.text, [node]);
            }
            if (ts.isImportSpecifier(node.parent) ||
                ts.isNamespaceImport(node.parent) ||
                ts.isImportClause(node.parent)) {
                const importBinding = getImportBinding(node, checker);
                if (importBinding?.symbol) {
                    importsBySymbol.set(importBinding.symbol, importBinding);
                }
            }
        }
        node.forEachChild(walk);
    };
    walk(sourceFile);
    return {
        checker,
        importsBySymbol,
        language: input.language,
        nodesByKind,
        program,
        identifiersByText,
        source: input.source,
        sourceFile,
    };
};
export const createDetectorContextsFromProgram = (inputs, program) => {
    if (!inputs.length) {
        return [];
    }
    const checker = program.getTypeChecker();
    return inputs.map((input) => buildContext(input, program, checker));
};
export const createDetectorContexts = (inputs) => {
    if (!inputs.length) {
        return [];
    }
    return createDetectorContextsFromProgram(inputs, buildProgram(inputs));
};
export const createDetectorContext = (input) => {
    const context = createDetectorContexts([input])[0];
    if (!context) {
        throw new Error(`Analyzer could not create a context for ${input.fileName}.`);
    }
    return context;
};
