import assert from "node:assert/strict";
import test from "node:test";

import { analyze, detectors } from "../src/index.ts";

const ruleIds = (source, language = "tsx") =>
  analyze({ source, language }).findings.map(({ ruleId }) => ruleId);

test("analyzer runs the declared detector set", () => {
  const result = analyze({ source: "const value = 1;", language: "ts" });

  assert.equal(result.checksRun, detectors.length);
  assert.equal(detectors.length, 9);
});

test("detects explicit any and type-only imports", () => {
  const result = analyze({
    language: "ts",
    source: `import { User } from "./types";\nconst parse = (value: any): User => value;`,
  });

  assert.deepEqual(
    result.findings.map(({ ruleId }) => ruleId),
    ["TS-003", "TS-001"],
  );
});

test("detects assertions over external runtime data", () => {
  assert.deepEqual(
    ruleIds(`const user = (await response.json()) as User;`, "ts"),
    ["TS-004"],
  );
  assert.deepEqual(
    ruleIds(`const user = payload as User;`, "ts"),
    [],
  );
});

test("detects legacy built-ins without shadowing local functions", () => {
  const result = analyze({
    language: "ts",
    source: `const id = parseInt(raw);\nobject.hasOwnProperty("id");`,
  });

  assert.deepEqual(
    result.findings.map(({ ruleId }) => ruleId),
    ["JS-004", "JS-004"],
  );

  assert.deepEqual(
    ruleIds(`const parseInt = (value: string) => value;\nparseInt(raw);`, "ts"),
    [],
  );
});

test("detects missing and unstable React list keys", () => {
  assert.deepEqual(
    ruleIds(`items.map((item) => <Row item={item} />);`),
    ["REACT-006"],
  );
  assert.deepEqual(
    ruleIds(`items.map((item, index) => <Row key={index} item={item} />);`),
    ["REACT-006"],
  );
  assert.deepEqual(
    ruleIds(`items.map((item) => <Row key={item.id} item={item} />);`),
    [],
  );
});

test("detects invalid Hook placement but permits React use() in control flow", () => {
  assert.deepEqual(
    ruleIds(`function Counter() {\n  if (enabled) useState(0);\n  return <div />;\n}`),
    ["REACT-009"],
  );
  assert.deepEqual(
    ruleIds(`function Counter() {\n  if (enabled) use(resource);\n  return <div />;\n}`),
    [],
  );
});

test("detects direct invocation of a local component", () => {
  const result = analyze({
    language: "tsx",
    source: `const UserCard = ({ name }) => <span>{name}</span>;\nconst content = UserCard({ name: "Ada" });`,
  });

  assert.deepEqual(
    result.findings.map(({ ruleId }) => ruleId),
    ["REACT-010"],
  );
});

test("detects exhaustive-deps suppressions", () => {
  assert.deepEqual(
    ruleIds(`function UserPanel() {\n  useEffect(() => load(userId), []); // eslint-disable-line react-hooks/exhaustive-deps\n  return <div />;\n}`),
    ["REACT-012"],
  );
});
