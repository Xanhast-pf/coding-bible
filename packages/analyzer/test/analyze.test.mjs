import assert from "node:assert/strict";
import test from "node:test";

import { analyze, detectors } from "../src/index.ts";

const ruleIds = (source, language = "tsx") =>
  analyze({ source, language }).findings.map(({ ruleId }) => ruleId);

const uniqueRuleIds = (source, language = "tsx") =>
  [...new Set(ruleIds(source, language))].sort();

test("analyzer runs only detectors applicable to the selected language", () => {
  assert.equal(detectors.length, 20);

  const tsResult = analyze({ source: "const value = 1;", language: "ts" });
  const tsxResult = analyze({ source: "const value = 1;", language: "tsx" });

  assert.equal(tsResult.checksRun, 11);
  assert.equal(tsResult.ruleIdsChecked.length, 11);
  assert.equal(tsxResult.checksRun, 20);
  assert.equal(tsxResult.ruleIdsChecked.length, 19);
});

test("syntax errors pause rule analysis instead of returning a misleading clean result", () => {
  const result = analyze({
    language: "tsx",
    source: "const View = () => <div>",
  });

  assert.equal(result.checksRun, 0);
  assert.equal(result.findings.length, 0);
  assert.equal(result.ruleIdsChecked.length, 0);
  assert.ok(result.diagnostics.length > 0);
});

test("detects explicit any and type-only imports by symbol identity", () => {
  const result = analyze({
    language: "ts",
    source: `import { User } from "./types";\nconst parse = (value: any): User => value;`,
  });

  assert.deepEqual(
    result.findings.map(({ ruleId }) => ruleId),
    ["TS-003", "TS-001"],
  );

  assert.deepEqual(
    ruleIds(
      `import { User } from "./types";\nfunction demo(User: string) { return User; }\ntype Saved = User;`,
      "ts",
    ),
    ["TS-003"],
  );

  assert.deepEqual(
    ruleIds(
      `import { Factory } from "./factory";\ntype FactoryType = typeof Factory;`,
      "ts",
    ),
    [],
  );
});

test("tracks unsafe external data through local aliases but permits unknown", () => {
  assert.deepEqual(
    ruleIds(
      `const raw = await response.json();\nconst payload = raw;\nconst user = payload as User;`,
      "ts",
    ),
    ["TS-004"],
  );
  assert.deepEqual(
    ruleIds(
      `const raw = await response.json();\nconst payload = raw as unknown;`,
      "ts",
    ),
    [],
  );
  assert.deepEqual(
    ruleIds(
      `const raw = await response.json();\nconst user = raw.user as User;`,
      "ts",
    ),
    ["TS-004"],
  );
  assert.deepEqual(ruleIds(`const user = payload as User;`, "ts"), []);
});

test("detects legacy globals without being confused by shadowed bindings", () => {
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

  assert.deepEqual(
    ruleIds(
      `function local(parseInt: (value: string) => number) { parseInt(raw); }\nconst id = parseInt(raw);`,
      "ts",
    ),
    ["JS-004"],
  );

  assert.deepEqual(
    ruleIds(
      `const window = { parseInt: Number.parseInt };\nwindow.parseInt(raw, 10);`,
      "ts",
    ),
    [],
  );

  assert.deepEqual(ruleIds(`window.parseInt(raw, 10);`, "ts"), ["JS-004"]);
});

test("detects prefer-const by binding instead of identifier name", () => {
  assert.deepEqual(ruleIds(`let user = getUser();`, "ts"), ["CORE-003"]);
  assert.deepEqual(ruleIds(`let count = 0;\ncount += 1;`, "ts"), []);
  assert.deepEqual(ruleIds(`let value = 0;\n[value] = values;`, "ts"), []);
  assert.deepEqual(
    ruleIds(
      `let value = getValue();\nfunction mutate(value: number) { value += 1; }`,
      "ts",
    ),
    ["CORE-003"],
  );
  assert.deepEqual(ruleIds(`let { user } = state;\nconsole.log(user);`, "ts"), [
    "CORE-003",
  ]);
});

test("detects optional-chaining guard chains including static element access", () => {
  assert.deepEqual(
    ruleIds(`const city = user && user.address && user.address.city;`, "ts"),
    ["JS-002"],
  );
  assert.deepEqual(
    ruleIds(
      `const city = user && user["address"] && user["address"].city;`,
      "ts",
    ),
    ["JS-002"],
  );
  assert.deepEqual(ruleIds(`const ready = enabled && load();`, "ts"), []);
});

test("suggests default parameters only when null semantics are preserved", () => {
  assert.deepEqual(
    ruleIds(
      `const process = (items?: Item[]) => {\n  items = items ?? [];\n};`,
      "ts",
    ),
    ["JS-003"],
  );
  assert.deepEqual(
    ruleIds(
      `const process = (item?: Item | null) => {\n  item = item ?? fallback;\n};`,
      "ts",
    ),
    [],
  );
});

test("detects mutation-prone collection copies through property receivers", () => {
  assert.deepEqual(
    ruleIds(`const sortedUsers = users.sort(compareUsers);`, "ts"),
    ["JS-006"],
  );
  assert.deepEqual(
    ruleIds(`const sortedUsers = props.users.sort(compareUsers);`, "ts"),
    ["JS-006"],
  );
  assert.deepEqual(ruleIds(`users.sort(compareUsers);`, "ts"), []);
  assert.deepEqual(
    ruleIds(
      `const users = [...source];\nconst sortedUsers = users.sort(compareUsers);`,
      "ts",
    ),
    [],
  );
});

test("detects missing, derived-index, and generated React list keys", () => {
  assert.deepEqual(ruleIds(`items.map((item) => <Row item={item} />);`), [
    "REACT-006",
  ]);
  assert.deepEqual(
    ruleIds(
      "items.map((item, index) => <Row key={`row-${index}`} item={item} />);",
    ),
    ["REACT-006"],
  );
  assert.deepEqual(
    ruleIds(
      "items.map((item) => <Row key={`row-${Math.random()}`} item={item} />);",
    ),
    ["REACT-006"],
  );
  assert.deepEqual(
    ruleIds(
      `items.map((item) => condition ? <Row item={item} /> : <Empty item={item} />);`,
    ),
    ["REACT-006", "REACT-006"],
  );
  assert.deepEqual(
    ruleIds(`items.map((item) => <Row key={item.id} item={item} />);`),
    [],
  );
});

test("detects aliased, namespaced, conditional, and post-return Hooks", () => {
  assert.deepEqual(
    ruleIds(
      `function Counter() {\n  if (enabled) useState(0);\n  return <div />;\n}`,
    ),
    ["REACT-009"],
  );
  assert.deepEqual(
    ruleIds(
      `import React from "react";\nfunction Counter() {\n  if (!enabled) return null;\n  React.useState(0);\n  return <div />;\n}`,
    ),
    ["REACT-009"],
  );
  assert.deepEqual(
    ruleIds(
      `import { useState as state } from "react";\nfunction Counter() {\n  if (enabled) state(0);\n  return <div />;\n}`,
    ),
    ["REACT-009"],
  );
  assert.deepEqual(
    ruleIds(
      `function Counter() {\n  if (enabled) use(resource);\n  return <div />;\n}`,
    ),
    [],
  );
});

test("detects direct invocation by component symbol without shadowing false positives", () => {
  assert.deepEqual(
    ruleIds(
      `const UserCard = ({ name }) => <span>{name}</span>;\nconst content = UserCard({ name: "Ada" });`,
    ),
    ["REACT-010"],
  );
  assert.deepEqual(
    ruleIds(
      `const UserCard = ({ name }) => <span>{name}</span>;\nfunction render(UserCard: () => string) { return UserCard(); }`,
    ),
    [],
  );
  assert.deepEqual(
    ruleIds(`function Factory() { return () => <span />; }\nFactory();`),
    [],
  );
});

test("detects exhaustive-deps suppressions only in comments", () => {
  assert.deepEqual(
    ruleIds(
      `function UserPanel() {\n  useEffect(() => load(userId), []); // eslint-disable-line react-hooks/exhaustive-deps\n  return <div />;\n}`,
    ),
    ["REACT-012"],
  );
  assert.deepEqual(
    ruleIds(
      `const example = "eslint-disable-line react-hooks/exhaustive-deps";`,
    ),
    [],
  );
});

test("does not suggest hoisting a static collection that is intentionally mutated locally", () => {
  assert.deepEqual(
    ruleIds(
      `const CountrySelect = () => {\n  const options = ["Canada", "France"];\n  options.push("Japan");\n  return <Select options={options} />;\n};`,
    ),
    [],
  );
  assert.deepEqual(
    ruleIds(
      `const CountrySelect = () => {\n  const options = ["Canada", "France"];\n  return <Select options={options} />;\n};`,
    ),
    ["REACT-008"],
  );
});

test("detects prop/state mutation through aliases and mutating methods", () => {
  assert.deepEqual(
    ruleIds(
      `const UserName = ({ user }) => {\n  const current = user;\n  current.name = current.name.trim();\n  return <span>{current.name}</span>;\n};`,
    ),
    ["REACT-011"],
  );
  assert.deepEqual(
    ruleIds(
      `const List = ({ users }) => {\n  users.sort(compareUsers);\n  return <div />;\n};`,
    ),
    ["REACT-011"],
  );
  assert.deepEqual(
    ruleIds(
      `const Counter = () => {\n  const [state] = useState({ count: 0 });\n  state.count += 1;\n  return <span>{state.count}</span>;\n};`,
    ),
    ["REACT-011"],
  );
});

test("detects common JSX accessibility violations conservatively", () => {
  assert.deepEqual(ruleIds(`<div onClick={handleSave}>Save</div>`), [
    "A11Y-001",
  ]);
  assert.deepEqual(
    uniqueRuleIds(
      `<div role="button" tabIndex={0} onClick={openMenu}>Menu</div>`,
    ),
    ["A11Y-001", "A11Y-002"],
  );
  assert.deepEqual(
    ruleIds(
      `<div role="button" tabIndex={0} onClick={openMenu} onKeyDown={onKeyDown}>Menu</div>`,
    ),
    ["A11Y-001"],
  );
  assert.deepEqual(
    ruleIds(`<a href="/settings" onClick={openSettings}>Settings</a>`),
    [],
  );
  assert.deepEqual(ruleIds(`<button type="button"><CloseIcon /></button>`), [
    "A11Y-004",
  ]);
  assert.deepEqual(
    ruleIds(
      `<button type="button">{open ? <CloseIcon /> : <OpenIcon />}</button>`,
    ),
    ["A11Y-004"],
  );
  assert.deepEqual(ruleIds(`<button type="button">Close</button>`), []);
  assert.deepEqual(
    ruleIds(`<button {...buttonProps}><CloseIcon /></button>`),
    [],
  );
});

test("detects GraphQL runtime interpolation through aliases and namespaces", () => {
  assert.deepEqual(
    ruleIds(
      'const document = gql`query UserQuery { user(id: "${userId}") { id } }`;',
      "ts",
    ),
    ["GQL-002"],
  );
  assert.deepEqual(
    ruleIds(
      'import { gql as graph } from "@apollo/client";\nconst document = graph`query { user(id: "${userId}") { id } }`;',
      "ts",
    ),
    ["GQL-002"],
  );
  assert.deepEqual(
    ruleIds(
      'import * as Apollo from "@apollo/client";\nconst document = Apollo.gql`query { user(id: "${userId}") { id } }`;',
      "ts",
    ),
    ["GQL-002"],
  );
  assert.deepEqual(
    ruleIds(
      "const UserFragment = gql`fragment UserFragment on User { id }`;\nconst document = gql`query UserQuery { user { ...UserFragment } } ${UserFragment}`;",
      "ts",
    ),
    [],
  );
  assert.deepEqual(
    ruleIds(
      "const gql = (parts: TemplateStringsArray) => parts;\nconst document = gql`hello ${userId}`;",
      "ts",
    ),
    [],
  );
});

test("detects Legend-State observer aliases without requiring a dollar-sign local observable", () => {
  assert.deepEqual(
    ruleIds(
      `const Component = observer(() => <div>{store$.name.get()}</div>);`,
    ),
    ["LEGEND-001"],
  );
  assert.deepEqual(
    ruleIds(
      `import { observable } from "@legendapp/state";\nimport { observer as watch } from "@legendapp/state/react";\nconst store = observable({ name: "Ada" });\nconst Component = watch(() => <div>{store.name.get()}</div>);`,
    ),
    ["LEGEND-001"],
  );
  assert.deepEqual(
    ruleIds(
      `const observer = (render) => render;\nconst Component = observer(() => <div>{store$.name.get()}</div>);`,
    ),
    [],
  );
});

test("analysis can be cancelled before detector execution", () => {
  const controller = new AbortController();
  controller.abort();

  assert.throws(
    () =>
      analyze(
        { source: "const value: any = 1;", language: "ts" },
        { signal: controller.signal },
      ),
    /aborted/i,
  );
});
