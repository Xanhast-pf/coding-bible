import ts from "typescript";

import type {
  AnalyzerFinding,
  DetectorContext,
  Detector,
} from "../../types.ts";
import { createFinding } from "../../utils.ts";

type ReferenceCounts = ReadonlyMap<
  ts.Symbol,
  ReadonlyMap<ts.SourceFile, number>
>;

const referencesByProgram = new WeakMap<ts.Program, ReferenceCounts>();

const resolveAlias = (
  checker: ts.TypeChecker,
  symbol: ts.Symbol | undefined,
): ts.Symbol | undefined => {
  if (!symbol) return undefined;
  return symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
};

const buildReferenceCounts = (context: DetectorContext): ReferenceCounts => {
  const cached = referencesByProgram.get(context.program);
  if (cached) return cached;

  const mutable = new Map<ts.Symbol, Map<ts.SourceFile, number>>();
  for (const sourceFile of context.program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;

    const visit = (node: ts.Node): void => {
      if (ts.isIdentifier(node)) {
        const symbol = resolveAlias(
          context.checker,
          context.checker.getSymbolAtLocation(node),
        );
        if (symbol) {
          let byFile = mutable.get(symbol);
          if (!byFile) {
            byFile = new Map();
            mutable.set(symbol, byFile);
          }
          byFile.set(sourceFile, (byFile.get(sourceFile) ?? 0) + 1);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  referencesByProgram.set(context.program, mutable);
  return mutable;
};

const analyze = (context: DetectorContext): readonly AnalyzerFinding[] => {
  const findings: AnalyzerFinding[] = [];
  const references = buildReferenceCounts(context);

  for (const statement of context.sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    if (
      !statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    ) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      if (
        !declaration.initializer ||
        (!ts.isArrowFunction(declaration.initializer) &&
          !ts.isFunctionExpression(declaration.initializer))
      ) {
        continue;
      }

      const symbol = resolveAlias(
        context.checker,
        context.checker.getSymbolAtLocation(declaration.name),
      );
      if (!symbol) continue;

      const byFile = references.get(symbol);
      const localReferences = byFile?.get(context.sourceFile) ?? 0;
      if (localReferences <= 1) continue;

      const hasExternalConsumer = [...(byFile?.keys() ?? [])].some(
        (sourceFile) => sourceFile !== context.sourceFile,
      );
      if (hasExternalConsumer) continue;

      findings.push(
        createFinding(context, declaration.name, {
          detectorId: "core_010-unused-public-helper",
          ruleId: "CORE-010",
          message:
            "This exported helper is used inside its declaring module but has no project consumer.",
          suggestion:
            "Keep the helper module-private unless another module intentionally depends on it.",
        }),
      );
    }
  }

  return findings;
};

export const core010Detectors = [
  {
    dependencyScope: "project",
    id: "core_010-unused-public-helper",
    ruleId: "CORE-010",
    languages: ["ts", "tsx", "js", "jsx"],
    profile: {
      confidence: "strong",
      impact: "medium",
      contextNote:
        "Project-wide symbol references are checked before reporting an exported helper as unnecessarily public.",
    },
    analyze,
  },
] satisfies readonly Detector[];
