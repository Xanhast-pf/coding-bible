import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const newRulebook = path.join(root, "scripts/rules/new-rulebook.mjs");
const validateRulebook = path.join(root, "scripts/rules/validate-rulebook.mjs");
const schemaGenerator = path.join(
  root,
  "scripts/rules/generate-custom-rulebook-schema.mjs",
);

const run = (script, args, cwd = root) =>
  spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8",
  });

test("rulebook:new scaffolds a schema-backed conservative import policy", () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "coding-bible-rulebook-"),
  );
  try {
    const output = path.join(directory, "frontend.json");
    const result = run(
      newRulebook,
      [
        "--name",
        "acme-frontend",
        "--id",
        "ACME-001",
        "--title",
        "Use the organization analytics wrapper",
        "--kind",
        "import",
        "--target",
        "@vendor/raw-analytics",
        "--output",
        output,
      ],
      directory,
    );

    assert.equal(result.status, 0, result.stderr);
    const ruleBook = JSON.parse(fs.readFileSync(output, "utf8"));
    assert.equal(
      ruleBook.$schema,
      "https://xanhast-pf.github.io/coding-bible/custom-rulebook.schema.json",
    );
    assert.equal(ruleBook.rules[0].confidence, "contextual");
    assert.deepEqual(ruleBook.rules[0].match, {
      kind: "import",
      source: "@vendor/raw-analytics",
    });
    assert.match(result.stdout, /rulebook:validate/u);
    assert.match(result.stdout, /rule:prompt/u);
  } finally {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

test("rulebook:new supports prefix imports and rejects call prefixes", () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "coding-bible-rulebook-"),
  );
  try {
    const output = path.join(directory, "private.json");
    const prefix = run(
      newRulebook,
      [
        "--name",
        "private-imports",
        "--id",
        "ACME-002",
        "--title",
        "Protect private imports",
        "--kind",
        "import",
        "--target",
        "@internal/private/",
        "--prefix",
        "--output",
        output,
      ],
      directory,
    );
    assert.equal(prefix.status, 0, prefix.stderr);
    assert.equal(
      JSON.parse(fs.readFileSync(output, "utf8")).rules[0].match.mode,
      "prefix",
    );

    const bad = run(
      newRulebook,
      [
        "--name",
        "http",
        "--id",
        "ACME-003",
        "--title",
        "Use the HTTP client",
        "--kind",
        "call",
        "--target",
        "fetch",
        "--prefix",
        "--output",
        path.join(directory, "bad.json"),
      ],
      directory,
    );
    assert.equal(bad.status, 2);
    assert.match(bad.stderr, /valid only with --kind import/u);
  } finally {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

test("rulebook:validate accepts generated rulebooks and rejects duplicate IDs", () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "coding-bible-rulebook-"),
  );
  try {
    const first = path.join(directory, "first.json");
    const second = path.join(directory, "second.json");
    for (const [output, id] of [
      [first, "ACME-010"],
      [second, "ACME-011"],
    ]) {
      const created = run(
        newRulebook,
        [
          "--name",
          path.basename(output, ".json"),
          "--id",
          id,
          "--title",
          "Example policy",
          "--kind",
          "call",
          "--target",
          "fetch",
          "--output",
          output,
        ],
        directory,
      );
      assert.equal(created.status, 0, created.stderr);
    }

    const valid = run(validateRulebook, [first, second], directory);
    assert.equal(valid.status, 0, valid.stderr);
    assert.match(valid.stdout, /ACME-010/u);
    assert.match(valid.stdout, /ACME-011/u);

    const duplicateBook = JSON.parse(fs.readFileSync(second, "utf8"));
    duplicateBook.rules[0].id = "ACME-010";
    fs.writeFileSync(second, `${JSON.stringify(duplicateBook, null, 2)}\n`);
    const duplicate = run(validateRulebook, [first, second], directory);
    assert.equal(duplicate.status, 2);
    assert.match(duplicate.stderr, /duplicates the ID/u);
  } finally {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

test("rulebook:validate rejects collisions with built-in automated rule IDs", () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "coding-bible-rulebook-"),
  );
  try {
    const output = path.join(directory, "collision.json");
    const created = run(
      newRulebook,
      [
        "--name",
        "collision",
        "--id",
        "TS-001",
        "--title",
        "Do not shadow a built-in rule",
        "--kind",
        "call",
        "--target",
        "fetch",
        "--output",
        output,
      ],
      directory,
    );
    assert.equal(created.status, 0, created.stderr);

    const validation = run(validateRulebook, [output], directory);
    assert.equal(validation.status, 2);
    assert.match(validation.stderr, /collides with a built-in automated rule/u);
  } finally {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

test("custom rulebook schema is generated and kept current", () => {
  const result = run(schemaGenerator, ["--check"]);
  assert.equal(result.status, 0, result.stderr);
  const schema = JSON.parse(
    fs.readFileSync(
      path.join(root, "apps/web/public/custom-rulebook.schema.json"),
      "utf8",
    ),
  );
  assert.equal(schema.properties.formatVersion.const, 1);
  assert.equal(schema.properties.rules.minItems, 1);
  assert.deepEqual(schema.properties.rules.items.properties.confidence.enum, [
    "certain",
    "strong",
    "contextual",
  ]);
  assert.equal(schema.properties.rules.items.properties.match.oneOf.length, 2);
});
