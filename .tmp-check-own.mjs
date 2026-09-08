import * as packs from "./packages/rules/src/rules/index.ts";
import { analyze, detectors } from "./packages/analyzer/src/index.ts";
const lang = new Map([
  ["css", "css"],
  ["graphql", "graphql"],
  ["js", "js"],
  ["javascript", "js"],
  ["jsx", "jsx"],
  ["ts", "ts"],
  ["typescript", "ts"],
  ["tsx", "tsx"],
]);
const rules = Object.values(packs).flat();
const by = new Map(rules.map((r) => [r.id, r]));
const ids = [...new Set(detectors.map((d) => d.ruleId))].sort();
let bm = 0,
  gd = 0,
  diag = 0;
for (const id of ids) {
  const r = by.get(id);
  for (const [kind, ex] of [
    ["bad", r.bad],
    ["good", r.good],
  ]) {
    const z = analyze({ language: lang.get(ex.language), source: ex.code });
    if (z.diagnostics.length) {
      diag++;
      console.log("DIAG", id, kind, z.diagnostics[0]?.message);
    }
    if (kind === "bad" && !z.findings.some((f) => f.ruleId === id)) {
      bm++;
      console.log(
        "BADMISS",
        id,
        z.findings.map((f) => f.ruleId),
      );
    }
    if (kind === "good" && z.findings.some((f) => f.ruleId === id)) {
      gd++;
      console.log(
        "OWNGOODDIRTY",
        id,
        z.findings.filter((f) => f.ruleId === id).map((f) => f.detectorId),
      );
    }
  }
}
console.log({
  rules: ids.length,
  badMiss: bm,
  ownGoodDirty: gd,
  diagnosticExamples: diag,
});
