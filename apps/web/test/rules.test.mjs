import assert from "node:assert/strict";
import test from "node:test";

import {
  countRulesByLevel,
  countRulesByPack,
  filterRules,
} from "../src/utils/rules.ts";

const rules = [
  {
    bad: { code: "const value: any = input;", language: "typescript" },
    detection: { autoFixable: false, detectable: true, strategy: "lint" },
    good: { code: "const value: unknown = input;", language: "typescript" },
    id: "TS-001",
    level: "must",
    pack: "typescript",
    rationale: "Compiler guarantees matter at boundaries.",
    status: "stable",
    summary: "Keep the compiler useful.",
    tags: ["types", "safety"],
    title: "Avoid any",
  },
  {
    bad: {
      code: "items.map((item, index) => <Row key={index} />);",
      language: "tsx",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
    good: {
      code: "items.map((item) => <Row key={item.id} />);",
      language: "tsx",
    },
    id: "REACT-006",
    level: "should",
    pack: "react",
    rationale: "Stable identity lets React preserve the right element.",
    status: "stable",
    summary: "Use stable keys.",
    tags: ["react", "lists"],
    title: "Use stable list keys",
  },
];

test("filterRules searches metadata and example code", () => {
  assert.deepEqual(
    filterRules(rules, " unknown ", "all", "all").map(({ id }) => id),
    ["TS-001"],
  );

  assert.deepEqual(
    filterRules(rules, "stable keys", "react", "should").map(({ id }) => id),
    ["REACT-006"],
  );
});

test("filterRules applies pack and level filters before search", () => {
  assert.deepEqual(
    filterRules(rules, "", "typescript", "must").map(({ id }) => id),
    ["TS-001"],
  );
  assert.deepEqual(filterRules(rules, "", "react", "must"), []);
});

test("rule counts include zero-valued configured entries", () => {
  const levelCounts = countRulesByLevel(rules, [
    "must",
    "should",
    "prefer",
    "avoid",
  ]);
  const packCounts = countRulesByPack(rules, ["typescript", "react", "css"]);

  assert.equal(levelCounts.get("must"), 1);
  assert.equal(levelCounts.get("prefer"), 0);
  assert.equal(packCounts.get("react"), 1);
  assert.equal(packCounts.get("css"), 0);
});
