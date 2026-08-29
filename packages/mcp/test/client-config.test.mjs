import assert from "node:assert/strict";
import test from "node:test";

import { createClientConfig } from "../src/clientConfig.ts";

const options = {
  nodeExecutable: "/usr/bin/node",
  rootDirectory: "/workspace/project",
  serverExecutable:
    "/workspace/coding-bible/packages/mcp/bin/coding-bible-mcp.mjs",
};

test("createClientConfig emits Claude Code/Cursor mcpServers configuration", () => {
  const config = createClientConfig("cursor", options);

  assert.deepEqual(config, {
    mcpServers: {
      "coding-bible": {
        type: "stdio",
        command: "/usr/bin/node",
        args: [
          "/workspace/coding-bible/packages/mcp/bin/coding-bible-mcp.mjs",
          "--root",
          "/workspace/project",
        ],
      },
    },
  });
});

test("createClientConfig emits VS Code's servers shape", () => {
  const config = createClientConfig("vscode", options);

  assert.deepEqual(config, {
    servers: {
      "coding-bible": {
        type: "stdio",
        command: "/usr/bin/node",
        args: [
          "/workspace/coding-bible/packages/mcp/bin/coding-bible-mcp.mjs",
          "--root",
          "/workspace/project",
        ],
      },
    },
  });
});
