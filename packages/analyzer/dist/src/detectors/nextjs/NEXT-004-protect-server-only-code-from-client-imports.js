import ts from "typescript";
import { createFinding } from "../../utils.js";
const clientDirective = "use client";
const serverOnlyModule = "server-only";
const projectIndexes = new WeakMap();
const hasDirective = (sourceFile, directive) => {
    for (const statement of sourceFile.statements) {
        if (!ts.isExpressionStatement(statement) ||
            !ts.isStringLiteral(statement.expression)) {
            return false;
        }
        if (statement.expression.text === directive) {
            return true;
        }
    }
    return false;
};
const getServerOnlyMarker = (sourceFile) => sourceFile.statements.find((statement) => ts.isImportDeclaration(statement) &&
    !statement.importClause &&
    ts.isStringLiteral(statement.moduleSpecifier) &&
    statement.moduleSpecifier.text === serverOnlyModule) ?? null;
const isRuntimeImport = (declaration) => {
    const clause = declaration.importClause;
    if (!clause) {
        return true;
    }
    if (clause.isTypeOnly) {
        return false;
    }
    if (clause.name) {
        return true;
    }
    const bindings = clause.namedBindings;
    if (!bindings || ts.isNamespaceImport(bindings)) {
        return true;
    }
    return (bindings.elements.length === 0 ||
        bindings.elements.some((element) => !element.isTypeOnly));
};
const isRuntimeExport = (declaration) => {
    if (declaration.isTypeOnly) {
        return false;
    }
    const clause = declaration.exportClause;
    if (!clause || ts.isNamespaceExport(clause)) {
        return true;
    }
    return (clause.elements.length === 0 ||
        clause.elements.some((element) => !element.isTypeOnly));
};
const resolveProjectSourceFile = (context, moduleSpecifier, projectSources) => {
    const symbol = context.checker.getSymbolAtLocation(moduleSpecifier);
    for (const declaration of symbol?.declarations ?? []) {
        const sourceFile = declaration.getSourceFile();
        if (projectSources.has(sourceFile)) {
            return sourceFile;
        }
    }
    return null;
};
const collectRuntimeEdges = (context, sourceFile, projectSources) => {
    const edges = [];
    const addEdge = (node, moduleSpecifier) => {
        if (moduleSpecifier.text === serverOnlyModule) {
            return;
        }
        const target = resolveProjectSourceFile(context, moduleSpecifier, projectSources);
        if (target && target !== sourceFile) {
            edges.push({ node, specifier: moduleSpecifier.text, target });
        }
    };
    for (const statement of sourceFile.statements) {
        if (ts.isImportDeclaration(statement) &&
            ts.isStringLiteral(statement.moduleSpecifier) &&
            isRuntimeImport(statement)) {
            addEdge(statement, statement.moduleSpecifier);
            continue;
        }
        if (ts.isExportDeclaration(statement) &&
            statement.moduleSpecifier &&
            ts.isStringLiteral(statement.moduleSpecifier) &&
            isRuntimeExport(statement)) {
            addEdge(statement, statement.moduleSpecifier);
        }
    }
    const visitDynamicImports = (node) => {
        if (ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword &&
            node.arguments.length === 1) {
            const [argument] = node.arguments;
            if (argument && ts.isStringLiteralLike(argument)) {
                addEdge(node, argument);
            }
        }
        node.forEachChild(visitDynamicImports);
    };
    sourceFile.forEachChild(visitDynamicImports);
    return edges;
};
const buildProjectIndex = (context) => {
    const cached = projectIndexes.get(context.program);
    if (cached) {
        return cached;
    }
    const projectSources = new Set(context.program
        .getSourceFiles()
        .filter((sourceFile) => !sourceFile.isDeclarationFile &&
        !context.program.isSourceFileFromExternalLibrary(sourceFile)));
    const clientEntries = new Set([...projectSources].filter((sourceFile) => hasDirective(sourceFile, clientDirective)));
    const serverOnlyMarkers = new Map();
    for (const sourceFile of projectSources) {
        const marker = getServerOnlyMarker(sourceFile);
        if (marker) {
            serverOnlyMarkers.set(sourceFile, marker);
        }
    }
    const edgesBySource = new Map();
    const sourcesByTarget = new Map();
    for (const sourceFile of projectSources) {
        const edges = collectRuntimeEdges(context, sourceFile, projectSources);
        edgesBySource.set(sourceFile, edges);
        for (const { target } of edges) {
            const sources = sourcesByTarget.get(target) ?? [];
            sources.push(sourceFile);
            sourcesByTarget.set(target, sources);
        }
    }
    const reachesServerOnly = new Set(serverOnlyMarkers.keys());
    const serverQueue = [...reachesServerOnly];
    for (let index = 0; index < serverQueue.length; index += 1) {
        const target = serverQueue[index];
        if (!target) {
            continue;
        }
        for (const source of sourcesByTarget.get(target) ?? []) {
            if (!reachesServerOnly.has(source)) {
                reachesServerOnly.add(source);
                serverQueue.push(source);
            }
        }
    }
    const reachableFromClient = new Set(clientEntries);
    const clientQueue = [...clientEntries];
    for (let index = 0; index < clientQueue.length; index += 1) {
        const source = clientQueue[index];
        if (!source) {
            continue;
        }
        for (const { target } of edgesBySource.get(source) ?? []) {
            if (!serverOnlyMarkers.has(target) && !reachableFromClient.has(target)) {
                reachableFromClient.add(target);
                clientQueue.push(target);
            }
        }
    }
    const built = {
        clientEntries,
        edgesBySource,
        reachableFromClient,
        reachesServerOnly,
        serverOnlyMarkers,
    };
    projectIndexes.set(context.program, built);
    return built;
};
const boundarySuggestion = "Move the server-only code behind a Server Component, Server Action, Route Handler, or another server boundary instead of importing it from a Client Component.";
const next004ServerOnlyLeakDetector = {
    id: "next-client-imports-server-only",
    ruleId: "NEXT-004",
    dependencyScope: "project",
    languages: ["js", "jsx", "ts", "tsx"],
    profile: { confidence: "certain", impact: "high" },
    analyze: (context) => {
        const index = buildProjectIndex(context);
        const findings = [];
        const { sourceFile } = context;
        const marker = index.serverOnlyMarkers.get(sourceFile);
        if (marker && index.clientEntries.has(sourceFile)) {
            findings.push(createFinding(context, marker, {
                detectorId: "next-client-imports-server-only",
                message: "This Client Component directly imports the server-only marker, so the module cannot be part of the client graph.",
                ruleId: "NEXT-004",
                suggestion: boundarySuggestion,
            }));
        }
        const isClientEntry = index.clientEntries.has(sourceFile);
        const isClientReachable = index.reachableFromClient.has(sourceFile);
        for (const edge of index.edgesBySource.get(sourceFile) ?? []) {
            if (isClientEntry && index.reachesServerOnly.has(edge.target)) {
                findings.push(createFinding(context, edge.node, {
                    detectorId: "next-client-imports-server-only",
                    message: `Runtime import \`${edge.specifier}\` enters a module graph that reaches code marked server-only.`,
                    ruleId: "NEXT-004",
                    suggestion: boundarySuggestion,
                }));
                continue;
            }
            if (!isClientEntry &&
                isClientReachable &&
                index.serverOnlyMarkers.has(edge.target)) {
                findings.push(createFinding(context, edge.node, {
                    detectorId: "next-client-imports-server-only",
                    message: `Runtime import \`${edge.specifier}\` is reachable from a Client Component and resolves to a module marked server-only.`,
                    ruleId: "NEXT-004",
                    suggestion: boundarySuggestion,
                }));
            }
        }
        return findings;
    },
};
export const next004Detectors = [next004ServerOnlyLeakDetector];
