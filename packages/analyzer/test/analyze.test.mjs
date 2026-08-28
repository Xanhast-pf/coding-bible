import assert from "node:assert/strict";
import test from "node:test";

import { analyze, detectors } from "../src/index.ts";

const ruleIds = (source, language = "tsx") =>
  analyze({ source, language }).findings.map(({ ruleId }) => ruleId);

test("analyzer runs the declared detector set", () => {
  const result = analyze({ source: "const value = 1;", language: "ts" });

  assert.equal(result.checksRun, detectors.length);
  assert.equal(detectors.length, 20);
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

test("detects exhaustive-deps suppressions only in comments", () => {
  assert.deepEqual(
    ruleIds(`function UserPanel() {\n  useEffect(() => load(userId), []); // eslint-disable-line react-hooks/exhaustive-deps\n  return <div />;\n}`),
    ["REACT-012"],
  );
  assert.deepEqual(
    ruleIds(`const example = "eslint-disable-line react-hooks/exhaustive-deps";`),
    [],
  );
});


test("detects prefer-const without flagging reassigned bindings", () => {
  assert.deepEqual(ruleIds(`let user = getUser();`, "ts"), ["CORE-003"]);
  assert.deepEqual(ruleIds(`let count = 0;\ncount += 1;`, "ts"), []);
  assert.deepEqual(ruleIds(`let value = 0;\n[value] = values;`, "ts"), []);
});

test("detects optional-chaining guard chains", () => {
  assert.deepEqual(
    ruleIds(`const city = user && user.address && user.address.city;`, "ts"),
    ["JS-002"],
  );
  assert.deepEqual(ruleIds(`const ready = enabled && load();`, "ts"), []);
});

test("detects body-level undefined defaults that belong in parameters", () => {
  assert.deepEqual(
    ruleIds(`const process = (items?: Item[]) => {\n  items = items ?? [];\n};`, "ts"),
    ["JS-003"],
  );
});

test("detects mutating sort/reverse results stored as separate values", () => {
  assert.deepEqual(
    ruleIds(`const sortedUsers = users.sort(compareUsers);`, "ts"),
    ["JS-006"],
  );
  assert.deepEqual(
    ruleIds(`users.sort(compareUsers);`, "ts"),
    [],
  );
});

test("detects common JSX accessibility violations", () => {
  assert.deepEqual(
    ruleIds(`<div onClick={handleSave}>Save</div>`),
    ["A11Y-001"],
  );
  assert.deepEqual(
    ruleIds(`<div role="button" tabIndex={0} onClick={openMenu}>Menu</div>`),
    ["A11Y-002"],
  );
  assert.deepEqual(
    ruleIds(`<button type="button"><CloseIcon /></button>`),
    ["A11Y-004"],
  );
  assert.deepEqual(
    ruleIds(`<button type="button">Close</button>`),
    [],
  );
  assert.deepEqual(
    ruleIds(`<button {...buttonProps}><CloseIcon /></button>`),
    [],
  );
});

test("detects runtime interpolation in gql templates", () => {
  assert.deepEqual(
    ruleIds('const document = gql`query UserQuery { user(id: "${userId}") { id } }`;', "ts"),
    ["GQL-002"],
  );
  assert.deepEqual(
    ruleIds('const document = gql`query UserQuery { user { ...UserFields } } ${UserFragment}`;', "ts"),
    [],
  );
});

test("detects Legend-State get() subscriptions inside observer renders", () => {
  assert.deepEqual(
    ruleIds(`const Component = observer(() => <div>{store$.name.get()}</div>);`),
    ["LEGEND-001"],
  );
});

test("detects static component allocations and prop mutation", () => {
  assert.deepEqual(
    ruleIds(`const CountrySelect = () => {\n  const options = ["Canada", "France"];\n  return <Select options={options} />;\n};`),
    ["REACT-008"],
  );
  assert.deepEqual(
    ruleIds(`const UserName = ({ user }) => {\n  user.name = user.name.trim();\n  return <span>{user.name}</span>;\n};`),
    ["REACT-011"],
  );
});
