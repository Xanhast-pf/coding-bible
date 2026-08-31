import assert from "node:assert/strict";
import test from "node:test";

import { analyze, detectors } from "../src/index.ts";

const ruleIds = (source, language = "tsx") =>
  analyze({ source, language }).findings.map(({ ruleId }) => ruleId);

const uniqueRuleIds = (source, language = "tsx") =>
  [...new Set(ruleIds(source, language))].sort();

test("analyzer runs only detectors applicable to the selected language", () => {
  assert.equal(detectors.length, 23);

  const tsResult = analyze({ source: "const value = 1;", language: "ts" });
  const tsxResult = analyze({ source: "const value = 1;", language: "tsx" });

  assert.equal(tsResult.checksRun, 13);
  assert.equal(tsResult.ruleIdsChecked.length, 13);
  assert.equal(tsxResult.checksRun, 23);
  assert.equal(tsxResult.ruleIdsChecked.length, 22);
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

test("detects only clearly redundant async functions", () => {
  assert.deepEqual(
    ruleIds(`async function getStatusLabel() { return "Ready"; }`, "ts"),
    ["JS-001"],
  );
  assert.deepEqual(
    ruleIds(`const load = async () => ({ ready: true });`, "ts"),
    ["JS-001"],
  );
  assert.deepEqual(
    ruleIds(`async function save() { doSynchronousWork(); }`, "ts"),
    ["JS-001"],
  );
  assert.deepEqual(
    ruleIds(`async function load() { return Promise.resolve("Ready"); }`, "ts"),
    [],
  );
  assert.deepEqual(
    ruleIds(`test("works", async () => { doSynchronousWork(); });`, "ts"),
    [],
  );
  assert.deepEqual(
    ruleIds(
      `const makeCandidate = (readSource = async () => "export {};") => ({ readSource });`,
      "ts",
    ),
    [],
  );
  assert.deepEqual(
    ruleIds(`const load = async (): Promise<string> => "Ready";`, "ts"),
    [],
  );
  assert.deepEqual(
    ruleIds(`const load: () => Promise<string> = async () => "Ready";`, "ts"),
    [],
  );
  assert.deepEqual(
    ruleIds(
      `type Loader = () => Promise<string>; const load: Loader = async () => "Ready";`,
      "ts",
    ),
    [],
  );
  assert.deepEqual(
    ruleIds(`async function load(): Promise<string> { return "Ready"; }`, "ts"),
    [],
  );
  assert.deepEqual(
    ruleIds(`async function load() { return fetchData(); }`, "ts"),
    [],
  );
  assert.deepEqual(
    ruleIds(
      `async function load() { await fetchData(); return "Ready"; }`,
      "ts",
    ),
    [],
  );
  assert.deepEqual(
    ruleIds(`async function fail() { throw new Error("nope"); }`, "ts"),
    [],
  );
  assert.deepEqual(ruleIds(`async function* stream() { yield 1; }`, "ts"), []);
  assert.deepEqual(
    ruleIds(
      `async function outer() { function inner() { return "Ready"; } return fetchData(); }`,
      "ts",
    ),
    [],
  );
});

test("detects hardcoded JSX text only in files that already use localization", () => {
  const localized = analyze({
    fileName: "src/View.js",
    language: "js",
    source: `import { FormattedMessage } from "react-intl";
export const View = () => <button>Save changes</button>;`,
  });
  assert.deepEqual(
    localized.findings.map(({ ruleId }) => ruleId),
    ["I18N-001"],
  );

  const entityOnly = analyze({
    fileName: "src/View.js",
    language: "js",
    source: `import { FormattedMessage } from "react-intl";
export const View = () => <span>&nbsp;-&nbsp;</span>;`,
  });
  assert.deepEqual(entityOnly.findings, []);

  const localizedExpression = analyze({
    fileName: "src/View.tsx",
    language: "tsx",
    source: `import { useIntl } from "react-intl";
export const View = () => { const { formatMessage } = useIntl(); return <button>{formatMessage({ id: "save" })}</button>; };`,
  });
  assert.deepEqual(localizedExpression.findings, []);

  const codeSample = analyze({
    fileName: "src/View.tsx",
    language: "tsx",
    source: `import { FormattedMessage } from "react-intl";
export const View = () => <pre>npm run build</pre>;`,
  });
  assert.deepEqual(codeSample.findings, []);

  const testFile = analyze({
    fileName: "src/View.test.tsx",
    language: "tsx",
    source: `import { FormattedMessage } from "react-intl";
export const View = () => <button>Save changes</button>;`,
  });
  assert.deepEqual(testFile.findings, []);

  const unlocalizedFile = analyze({
    fileName: "src/View.tsx",
    language: "tsx",
    source: `export const View = () => <button>Save changes</button>;`,
  });
  assert.deepEqual(unlocalizedFile.findings, []);
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

test("tracks Hook execution paths instead of syntax ancestry", () => {
  assert.deepEqual(
    ruleIds(
      `function Panel() {\n  if (useFeatureToggle(FLAG)) return <div />;\n  return null;\n}`,
    ),
    [],
  );

  assert.deepEqual(
    ruleIds(
      `function Panel() {\n  return useFeatureToggle(FLAG) ? <Enabled /> : <Disabled />;\n}`,
    ),
    [],
  );

  assert.deepEqual(
    ruleIds(
      `function Panel() {\n  const enabled = useFeatureToggle(FLAG) && permission;\n  return <div>{enabled}</div>;\n}`,
    ),
    [],
  );

  assert.deepEqual(
    ruleIds(
      `function Panel() {\n  const enabled = permission && useFeatureToggle(FLAG);\n  return <div>{enabled}</div>;\n}`,
    ),
    ["REACT-009"],
  );

  assert.deepEqual(
    ruleIds(
      `function Panel() {\n  return enabled ? useFeatureToggle(FLAG) : false;\n}`,
    ),
    ["REACT-009"],
  );
});

test("ignores throws and nested helper returns for Hook ordering", () => {
  assert.deepEqual(
    ruleIds(
      `function Panel() {\n  if (failed) throw new Error("boom");\n  useState(0);\n  return <div />;\n}`,
    ),
    [],
  );

  assert.deepEqual(
    ruleIds(
      `function useThing() {\n  function helper() { return false; }\n  useEffect(() => helper(), []);\n}`,
    ),
    [],
  );

  assert.deepEqual(
    ruleIds(
      `function Panel() {\n  if (hidden) return null;\n  useState(0);\n  return <div />;\n}`,
    ),
    ["REACT-009"],
  );

  assert.deepEqual(
    ruleIds(`function useUnreachable() {\n  return;\n  useState(0);\n}`),
    [],
  );
});

test("accepts Hooks in component wrappers and renderHook harnesses", () => {
  assert.deepEqual(
    ruleIds(
      `import { memo, useRef } from "react";\nconst FormBuilder = memo(() => {\n  const ref = useRef(null);\n  return <div ref={ref} />;\n});`,
    ),
    [],
  );

  assert.deepEqual(
    ruleIds(
      `import { observer as watch } from "@legendapp/state/react";\nconst DownloadForm = watch(() => {\n  const value = useValue(store$.value);\n  return <div>{value}</div>;\n});`,
    ),
    [],
  );

  assert.deepEqual(
    ruleIds(
      `import { renderHook as testHook } from "@testing-library/react-hooks";\ntestHook(() => useLocalStorage("key"));`,
    ),
    [],
  );

  assert.deepEqual(
    ruleIds(`renderHook(() => {\n  if (enabled) useState(0);\n});`),
    ["REACT-009"],
  );

  assert.deepEqual(ruleIds(`items.map(() => useState(0));`), ["REACT-009"]);

  assert.deepEqual(
    ruleIds(
      `const observer = (render) => render();\nobserver(() => useState(0));`,
    ),
    ["REACT-009"],
  );
  assert.deepEqual(
    ruleIds(
      `const renderHook = (render) => render();\nrenderHook(() => useState(0));`,
    ),
    ["REACT-009"],
  );
  assert.deepEqual(
    ruleIds(`const memo = (render) => render();\nmemo(() => useState(0));`),
    ["REACT-009"],
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

test("does not hoist objects whose computed keys depend on component inputs", () => {
  assert.deepEqual(
    ruleIds(
      `const Toast = ({ type }) => {\n  const typeObj = { [type]: true };\n  return <Message {...typeObj} />;\n};`,
      "js",
    ),
    [],
  );
  assert.deepEqual(
    ruleIds(
      `const Sidebar = ({ isRight }) => {\n  const params = { [isRight ? "right" : "left"]: "0" };\n  return <Panel {...params} />;\n};`,
      "js",
    ),
    [],
  );
  assert.deepEqual(
    ruleIds(
      `const View = () => {\n  const attrs = { ["data-kind"]: "static" };\n  return <div {...attrs} />;\n};`,
      "js",
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

test("treats React ref current containers as intentionally mutable", () => {
  assert.deepEqual(
    ruleIds(
      `const View = ({ inputRef }) => { inputRef.current = node; inputRef.current.value = null; return <div />; };`,
      "js",
    ),
    [],
  );
  assert.deepEqual(
    ruleIds(
      `const View = ({ pagination }) => { pagination.current = 2; return <div />; };`,
      "js",
    ),
    ["REACT-011"],
  );
});

test("runs JSX-specific detectors for legacy .js React source", () => {
  assert.deepEqual(
    uniqueRuleIds(
      `const View = ({ items, user }) => (
        <div onClick={() => { user.name = "next"; }}>
          {items.map((item) => <span>{item.name}</span>)}
        </div>
      );`,
      "js",
    ),
    ["A11Y-001", "REACT-006", "REACT-011"],
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

test("detects state that is only synchronized from Effect dependencies", () => {
  assert.deepEqual(
    ruleIds(`import { useEffect, useState } from "react";
const View = ({ items }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(items.length);
  }, [items]);
  return <span>{count}</span>;
};`),
    ["REACT-004"],
  );

  assert.deepEqual(
    ruleIds(`import * as React from "react";
const View = ({ items }) => {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => setVisible(items.length > 0), [items]);
  return <span>{String(visible)}</span>;
};`),
    ["REACT-004"],
  );
});

test("does not confuse editable, reset, or accumulated state with derived state", () => {
  assert.deepEqual(
    ruleIds(`import { useEffect, useState } from "react";
const Field = ({ value }) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return <input value={draft} onChange={(event) => setDraft(event.target.value)} />;
};`),
    [],
  );

  assert.deepEqual(
    ruleIds(`import { useEffect, useState } from "react";
const View = ({ userId }) => {
  const [error, setError] = useState(null);
  useEffect(() => { setError(null); }, [userId]);
  return <span>{error}</span>;
};`),
    [],
  );

  assert.deepEqual(
    ruleIds(`import { useEffect, useState } from "react";
const View = ({ amount }) => {
  const [total, setTotal] = useState(0);
  useEffect(() => { setTotal((current) => current + amount); }, [amount]);
  return <span>{total}</span>;
};`),
    [],
  );

  assert.deepEqual(
    ruleIds(`import { useEffect, useState } from "react";
const useEditable = ({ value }) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return { draft, setDraft };
};`),
    [],
  );

  assert.deepEqual(
    ruleIds(`import { useEffect, useState } from "react";
const useCurrent = ({ source }) => {
  const [current, setCurrent] = useState({});
  const response = useSource({ fallback: current, source });
  useEffect(() => { setCurrent(response); }, [response]);
  return current;
};`),
    [],
  );
});

test("derived-state detection respects shadowed React hook names", () => {
  assert.deepEqual(
    ruleIds(`const useState = (value) => [value, () => {}];
const useEffect = (callback) => callback();
const View = ({ value }) => {
  const [copy, setCopy] = useState(value);
  useEffect(() => { setCopy(value); }, [value]);
  return <span>{copy}</span>;
};`),
    [],
  );
});
