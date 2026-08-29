import assert from "node:assert/strict";
import test from "node:test";
import { PassThrough } from "node:stream";

import { writeCommand } from "../src/github.mjs";

test("GitHub workflow command output escapes annotation data", async () => {
  const stream = new PassThrough();
  let output = "";
  stream.on("data", (chunk) => {
    output += chunk.toString();
  });

  writeCommand(
    stream,
    "error",
    { file: "src/a,b.ts", line: 3, title: "TS-001: Avoid any" },
    "bad%\nvalue",
  );
  stream.end();
  await new Promise((resolve) => stream.on("end", resolve));

  assert.equal(
    output,
    "::error file=src/a%2Cb.ts,line=3,title=TS-001%3A Avoid any::bad%25%0Avalue\n",
  );
});
