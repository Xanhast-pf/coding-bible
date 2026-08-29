import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL(
  "./rules.json",
  import.meta.url,
);
let catalogPromise;

const readRules = (payload) => {
  if (!Array.isArray(payload?.rules)) {
    throw new Error("Coding Bible rule catalog is invalid.");
  }
  return payload.rules;
};

export const loadRuleCatalog = async () => {
  catalogPromise ??= readFile(fileURLToPath(sourceUrl), "utf8")
    .then(JSON.parse)
    .then(readRules);
  return catalogPromise;
};

export const createRuleMap = async () =>
  new Map((await loadRuleCatalog()).map((rule) => [rule.id, rule]));
