import { fileURLToPath } from "node:url";

export const mcpClients = ["claude-code", "cursor", "vscode"] as const;
export type McpClient = (typeof mcpClients)[number];

export interface ClientConfigOptions {
  nodeExecutable?: string;
  rootDirectory: string;
  serverExecutable?: string;
}

const defaultServerExecutable = fileURLToPath(
  new URL("../bin/coding-bible-mcp.mjs", import.meta.url),
);

const createServerEntry = ({
  nodeExecutable = process.execPath,
  rootDirectory,
  serverExecutable = defaultServerExecutable,
}: ClientConfigOptions) => ({
  type: "stdio" as const,
  command: nodeExecutable,
  args: [serverExecutable, "--root", rootDirectory],
});

export const createClientConfig = (
  client: McpClient,
  options: ClientConfigOptions,
) => {
  const server = createServerEntry(options);

  if (client === "vscode") {
    return {
      servers: {
        "coding-bible": server,
      },
    };
  }

  return {
    mcpServers: {
      "coding-bible": server,
    },
  };
};
