import { fromJsonSchema, McpServer } from "@modelcontextprotocol/server";

import { checkCode, type CheckCodeInput } from "./checkCode.ts";
import { checkFiles, type CheckFilesInput } from "./checkFiles.ts";
import { codingBibleCanonicalUrl, codingBibleMcpVersion } from "./constants.ts";
import { getProjectGuidance } from "./projectGuidance.ts";
import { getRule } from "./getRule.ts";
import {
  checkCodeInputSchema,
  checkFilesInputSchema,
  getProjectGuidanceInputSchema,
  getRuleInputSchema,
} from "./schemas.ts";

export interface CodingBibleMcpServerOptions {
  canonicalBaseUrl?: string;
  rootDirectory?: string;
}

interface GetRuleInput {
  ruleId: string;
}

interface GetProjectGuidanceInput {
  path?: string;
}

const toolAnnotations = {
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
  readOnlyHint: true,
} as const;

const toStructuredContent = (value: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value));

const asToolResult = (value: object, text: string) => ({
  content: [{ type: "text" as const, text }],
  structuredContent: toStructuredContent(value),
});

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Coding Bible MCP tool failed.";

const asToolError = (error: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: getErrorMessage(error),
    },
  ],
  isError: true,
});

const summarizeCodeCheck = (result: ReturnType<typeof checkCode>) => {
  if (result.summary.diagnostics) {
    return `Coding Bible could not analyze ${result.fileName}: ${result.summary.diagnostics} syntax diagnostic(s).`;
  }

  return `Coding Bible checked ${result.fileName} with ${result.summary.checksRun} detector(s) and found ${result.summary.findings} violation(s).`;
};

const summarizeFileCheck = (result: Awaited<ReturnType<typeof checkFiles>>) => {
  const { summary } = result.analyzer;

  return `Coding Bible checked ${summary.filesAnalyzed} file(s): ${summary.errors} error(s), ${summary.warnings} warning(s), ${summary.diagnostics} syntax diagnostic(s).`;
};

export const createCodingBibleMcpServer = (
  options: CodingBibleMcpServerOptions = {},
) => {
  const canonicalBaseUrl = options.canonicalBaseUrl ?? codingBibleCanonicalUrl;
  const rootDirectory = options.rootDirectory ?? process.cwd();
  const server = new McpServer({
    name: "coding-bible",
    version: codingBibleMcpVersion,
  });

  server.registerTool(
    "check_code",
    {
      title: "Check code",
      description:
        "Run Coding Bible's deterministic analyzer against an in-memory JavaScript or TypeScript snippet.",
      inputSchema: fromJsonSchema<CheckCodeInput>(checkCodeInputSchema),
      annotations: toolAnnotations,
    },
    async (input) => {
      try {
        const result = checkCode(input, { canonicalBaseUrl });
        return asToolResult(result, summarizeCodeCheck(result));
      } catch (error) {
        return asToolError(error);
      }
    },
  );

  server.registerTool(
    "check_files",
    {
      title: "Check files",
      description:
        "Run the project-aware Coding Bible analyzer against files or directories inside the configured project root. The MCP path disables analyzer cache writes.",
      inputSchema: fromJsonSchema<CheckFilesInput>(checkFilesInputSchema),
      annotations: toolAnnotations,
    },
    async (input, context) => {
      try {
        const result = await checkFiles(input, {
          rootDirectory,
          signal: context.mcpReq.signal,
        });
        return asToolResult(result, summarizeFileCheck(result));
      } catch (error) {
        return asToolError(error);
      }
    },
  );

  server.registerTool(
    "get_rule",
    {
      title: "Get rule",
      description:
        "Retrieve one canonical Coding Bible rule, including rationale, examples, exceptions, references, and its agent prompt.",
      inputSchema: fromJsonSchema<GetRuleInput>(getRuleInputSchema),
      annotations: toolAnnotations,
    },
    async ({ ruleId }) => {
      const result = getRule(ruleId, { canonicalBaseUrl });

      if (!result) {
        return asToolError(new Error(`Unknown Coding Bible rule: ${ruleId}`));
      }

      return asToolResult(result, result.prompt);
    },
  );

  server.registerTool(
    "get_project_guidance",
    {
      title: "Get project guidance",
      description:
        "Build Coding Bible agent guidance for a local project. Foundation and quality packs are always included; ecosystem packs are selected from package manifests.",
      inputSchema: fromJsonSchema<GetProjectGuidanceInput>(
        getProjectGuidanceInputSchema,
      ),
      annotations: toolAnnotations,
    },
    async (input) => {
      try {
        const result = await getProjectGuidance(input, {
          canonicalBaseUrl,
          rootDirectory,
        });
        return asToolResult(result, result.guidance);
      } catch (error) {
        return asToolError(error);
      }
    },
  );

  return server;
};
