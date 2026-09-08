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
let badMiss = 0,
  goodDirty = 0;
for (const id of ids) {
  const r = by.get(id);
  if (!r) {
    console.log("NORULE", id);
    continue;
  }
  const b = analyze({ language: lang.get(r.bad.language), source: r.bad.code });
  if (!b.findings.some((f) => f.ruleId === id)) {
    badMiss++;
    console.log(
      "BADMISS",
      id,
      "got",
      b.findings.map((f) => f.ruleId).join(","),
    );
  }
  const g = analyze({
    language: lang.get(r.good.language),
    source: r.good.code,
  });
  if (g.findings.length) {
    goodDirty++;
    console.log(
      "GOODDIRTY",
      id,
      "=>",
      g.findings.map((f) => f.ruleId).join(","),
    );
  }
}
console.log({ rules: ids.length, badMiss, goodDirty });
