import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { js005Rule } from "../../rules/src/rules/javascript/JS-005-scope-try-catch-to-the-operation-that-can-fail.ts";
import { analyze } from "../src/index.ts";

const findings = (source, language = "ts") => {
  const result = analyze({ source, language });
  assert.deepEqual(result.diagnostics, []);
  return result.findings.filter((finding) => finding.ruleId === "JS-005");
};

test("JS-005: hydration cleanup and a later render are separate boundaries", async () => {
  const source = await readFile(
    new URL("./fixtures/try-finally-hydration.tsx.fixture", import.meta.url),
    "utf8",
  );
  assert.deepEqual(findings(source, "tsx"), []);
});

test("JS-005: exact canonical DON'T reports and DO remains clean", () => {
  assert.equal(findings(js005Rule.bad.code).length, 1);
  assert.deepEqual(findings(js005Rule.good.code), []);
});

const clean = {
  "direct finally cleanup":
    "try { buildPayload(); work(); } finally { cleanup(); }",
  "block in finally":
    "try { buildPayload(); work(); } finally { { cleanup(); } }",
  "narrow catch with finally":
    "try { work(); } catch { failed(); } finally { renderCleanup(); }",
  "early return with finally":
    "function run() { try { buildPayload(); return work(); } finally { cleanup(); } }",
  "throw with finally":
    "try { buildPayload(); throw new Error(); } finally { cleanup(); }",
  "render after catch": "try { work(); } catch { failed(); } renderResult();",
  "render inside catch": "try { work(); } catch { renderError(); }",
  "deferred function is a separate boundary":
    "try { const later = () => { buildPayload(); work(); }; register(later); } catch { failed(); }",
  "comment and string are not calls":
    'try { work(); /* buildPayload(); */ log("renderResult()"); } catch { failed(); }',
  // Cleanup completeness is not the canonical catch-scope contract.
  "finally without cleanup and without catch":
    'try { buildPayload(); work(); } finally { log("done"); }',
  "conditional cleanup without catch":
    "try { buildPayload(); work(); } finally { if (ready) cleanup(); }",
  "narrow single transformation": "try { renderResult(); } catch { failed(); }",
};
for (const [name, source] of Object.entries(clean)) {
  test(`JS-005 clean: ${name}`, () => assert.deepEqual(findings(source), []));
}

const broad = "buildPayload(); work();";
const violations = {
  "cleanup absent": `try { ${broad} } catch { failed(); }`,
  "cleanup on success only": `try { ${broad} cleanup(); } catch { failed(); }`,
  "cleanup in catch only": `try { ${broad} } catch { cleanup(); }`,
  "return skips later cleanup": `function run() { try { ${broad} return; } catch { failed(); } cleanup(); }`,
  "throw skips later cleanup": `try { ${broad} } catch { throw new Error(); } cleanup();`,
  "conditional finally cleanup": `try { ${broad} } catch { failed(); } finally { if (ready) cleanup(); }`,
  "branch inside try":
    "try { if (ready) buildPayload(); work(); } catch { failed(); }",
  "unrelated finally": `try { ${broad} } catch { failed(); } finally { log("done"); }`,
  "guaranteed cleanup does not narrow a broad catch": `try { ${broad} } catch { failed(); } finally { cleanup(); }`,
  "nested finally does not hide outer catch": `try { try { ${broad} } finally { cleanup(); } } catch { failed(); }`,
  "nested catch is checked independently": `try { try { ${broad} } catch { failed(); } } finally { cleanup(); }`,
};
for (const [name, source] of Object.entries(violations)) {
  test(`JS-005 reports broad catch: ${name}`, () => {
    assert.equal(findings(source).length, 1);
  });
}

test("JS-005 reports separate broad catches at their own source locations", () => {
  const source = `try { ${broad} } catch { failed(); }\ntry { ${broad} } catch { failed(); }`;
  const result = findings(source);
  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map((finding) => finding.location.line),
    [1, 2],
  );
});
