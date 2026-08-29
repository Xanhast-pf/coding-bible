import ts from "typescript";

import type {
  AnalyzerLanguage,
  DetectorContext,
  ImportBinding,
} from "./types.ts";

const scriptKindByLanguage = {
  js: ts.ScriptKind.JS,
  jsx: ts.ScriptKind.JSX,
  ts: ts.ScriptKind.TS,
  tsx: ts.ScriptKind.TSX,
} satisfies Record<AnalyzerLanguage, ts.ScriptKind>;

const compilerOptions: ts.CompilerOptions = {
  allowJs: true,
  checkJs: false,
  jsx: ts.JsxEmit.Preserve,
  noLib: true,
  noResolve: true,
  strict: true,
  target: ts.ScriptTarget.ES2022,
};

export interface ResolvedAnalyzeInput {
  fileName: string;
  language: AnalyzerLanguage;
  source: string;
}

const buildProgram = (inputs: readonly ResolvedAnalyzeInput[]) => {
  const inputsByFileName = new Map(inputs.map((input) => [input.fileName, input]));
  const sourceFiles = new Map(
    inputs.map((input) => [
      input.fileName,
      ts.createSourceFile(
        input.fileName,
        input.source,
        ts.ScriptTarget.Latest,
        true,
        scriptKindByLanguage[input.language],
      ),
    ]),
  );

  const host: ts.CompilerHost = {
    fileExists: (candidate) => inputsByFileName.has(candidate),
    getCanonicalFileName: (candidate) => candidate,
    getCurrentDirectory: () => "",
    getDefaultLibFileName: () => "lib.d.ts",
    getNewLine: () => "\n",
    getSourceFile: (candidate) => sourceFiles.get(candidate),
    readFile: (candidate) => inputsByFileName.get(candidate)?.source,
    useCaseSensitiveFileNames: () => true,
    writeFile: () => {},
  };

  return ts.createProgram(
    inputs.map(({ fileName }) => fileName),
    compilerOptions,
    host,
  );
};

const getImportBinding = (
  node: ts.Identifier,
  checker: ts.TypeChecker,
): ImportBinding | null => {
  const parent = node.parent;

  if (ts.isImportSpecifier(parent) && parent.name === node) {
    const declaration = parent.parent.parent.parent;
    if (!ts.isImportDeclaration(declaration) || !ts.isStringLiteral(declaration.moduleSpecifier)) {
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
    if (!ts.isImportDeclaration(declaration) || !ts.isStringLiteral(declaration.moduleSpecifier)) {
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
    if (!ts.isImportDeclaration(declaration) || !ts.isStringLiteral(declaration.moduleSpecifier)) {
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

const buildContext = (
  input: ResolvedAnalyzeInput,
  program: ts.Program,
  checker: ts.TypeChecker,
): DetectorContext => {
  const sourceFile = program.getSourceFile(input.fileName);
  if (!sourceFile) {
    throw new Error(`Analyzer could not bind ${input.fileName}.`);
  }

  const importsBySymbol = new Map<ts.Symbol, ImportBinding>();
  const nodesByKind = new Map<ts.SyntaxKind, ts.Node[]>();
  const referencesBySymbol = new Map<ts.Symbol, ts.Identifier[]>();

  const walk = (node: ts.Node) => {
    const bucket = nodesByKind.get(node.kind);
    if (bucket) {
      bucket.push(node);
    } else {
      nodesByKind.set(node.kind, [node]);
    }

    if (ts.isIdentifier(node)) {
      const symbol = checker.getSymbolAtLocation(node);
      if (symbol) {
        const references = referencesBySymbol.get(symbol);
        if (references) {
          references.push(node);
        } else {
          referencesBySymbol.set(symbol, [node]);
        }
      }

      const importBinding = getImportBinding(node, checker);
      if (importBinding?.symbol) {
        importsBySymbol.set(importBinding.symbol, importBinding);
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
    referencesBySymbol,
    source: input.source,
    sourceFile,
  };
};

export const createDetectorContexts = (
  inputs: readonly ResolvedAnalyzeInput[],
): readonly DetectorContext[] => {
  if (!inputs.length) {
    return [];
  }

  const program = buildProgram(inputs);
  const checker = program.getTypeChecker();
  return inputs.map((input) => buildContext(input, program, checker));
};

export const createDetectorContext = (input: ResolvedAnalyzeInput) => {
  const context = createDetectorContexts([input])[0];
  if (!context) {
    throw new Error(`Analyzer could not create a context for ${input.fileName}.`);
  }
  return context;
};
